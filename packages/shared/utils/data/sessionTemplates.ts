import { DateTime } from "luxon";
import * as RRulePkg from "rrule";
import type { Database } from "../../types";
const { RRule } = RRulePkg;



// -------[  FRONTEND --> BACKEND UTILITIES  ]-------


// Date/Time/Zones -> Helper Fn(s):
export function utcDateFromJs(date: Date, zone: string) {
    const base = DateTime.fromJSDate(date);
    return DateTime.fromObject({
        year: base.year,
        month: base.month,
        day: base.day,
        hour: base.hour,
        minute: base.minute,
    }, { zone }).startOf('minute').toUTC()
}

export function getPostOffsetMsFromJs(opts: {
    startDate: Date
    postTime: Date
    postDay: 'Day before' | 'Day of'
    zone: string
}): number {
    const { startDate, postTime, postDay, zone } = opts
    // Form DateTime Dates from JS:
    const startBase = DateTime.fromJSDate(startDate)
    const start = DateTime.fromObject(
        {
            year: startBase.year,
            month: startBase.month,
            day: startBase.day,
            hour: startBase.hour,
            minute: startBase.minute,
            second: 0,
            millisecond: 0
        },
        { zone }
    )
    const postBase = DateTime.fromJSDate(postTime)
    let post = DateTime.fromObject(
        {
            year: start.year,
            month: start.month,
            day: start.day,
            hour: postBase.hour,
            minute: postBase.minute,
            second: 0,
            millisecond: 0
        },
        { zone }
    )
    // Apply Post Day Selection
    if (postDay === 'Day before') {
        post = post.minus({ days: 1 })
    }
    // Calculate Ms
    const offsetMs = post.toUTC().toMillis() - start.toUTC().toMillis()
    // Safety clamp
    return Math.min(offsetMs, 0)
}



// -------[  BACKEND --> FRONTEND UTILITIES  ]-------


export function dbIsoUtcToFormDate(
    isoUtc: string,
    zone: string,
    addMs?: number
): Date {
    let base = DateTime
        .fromISO(isoUtc, { zone })

    if (addMs) {
        base = base.plus({ milliseconds: addMs })
    }

    let result = new Date()
    result.setFullYear(base.year, (base.month - 1), base.day)
    result.setHours(base.hour, base.minute, 0, 0)

    return result // UI/Form only Date
}


export function dbIsoUtcToDateTime(
    isoUtc: string,
    zone: string,
    addMs?: number
): DateTime {
    let base = DateTime.fromISO(isoUtc, { zone })

    if (addMs) {
        base = base.plus({ milliseconds: addMs })
    }

    return base
}


export function determinePostDay(startIso: string, offsetMs: number, zone: string) {
    const start = DateTime.fromISO(startIso, { zone: 'utc' }).setZone(zone);
    const post = start.plus({ milliseconds: offsetMs })
    return post.startOf('day') < start.startOf('day')
        ? 'Day before'
        : 'Day of'
}


export function mapRsvps(rsvpJSON: any) {
    const parsed = JSON.parse(String(rsvpJSON));
    const rsvpMap = new Map<string, {
        name: string;
        emoji: string | null;
        capacity: number;
    }>(Object.entries(parsed));
    return rsvpMap;
}



// -------[  HYBRID --> SESSION TEMPLATES  ]-------


export function buildRule(rrule: string, start: DateTime): RRulePkg.RRule {
    const base = RRule.fromString(rrule);
    return new RRule({
        ...base.options,
        dtstart: start.toJSDate(),
    });
}


export function calculateNextPostUTC(opts: {
    firstDate: DateTime,
    zone: string,
    post_before_ms: number,
    rrule?: string | null,
    fromDate?: DateTime
    includeBuffer?: boolean
}): DateTime | null {
    // Get options
    let { firstDate, zone, post_before_ms, rrule, fromDate, includeBuffer } = opts;
    const bufferSecs = includeBuffer ? (5 * 60) : 0; // 5 mins / 0 secs
    firstDate = firstDate.setZone(zone);
    fromDate = fromDate?.setZone(zone);

    // Get dates
    let now = DateTime.now().setZone(zone);
    if (fromDate) {
        now = fromDate.setZone(zone);
    }
    // Get recurrence:
    const rule = rrule ? buildRule(rrule, firstDate) : null

    // If no rule/recurrence:
    if (!rule) {
        // No REPEATS - If last post < past today:
        const post = firstDate
            .plus({ millisecond: post_before_ms })
            .toUTC()
            .startOf('minute')
        if ((post.toSeconds() + bufferSecs) <= now.toSeconds()) {
            // last post already occurred
            return null
        } else {
            return post
        }
    } else {
        // REPEATS - Determine rule dates:
        const next = rule.after(now.toJSDate(), true)
        if (!next) return null;
        const nextPost = DateTime.fromJSDate(next, { zone: 'utc' })
            .setZone(zone)
            .set({ hour: firstDate.hour, minute: firstDate.minute }) // !? maybe err here ?
            .plus({ millisecond: post_before_ms })
            .startOf('minute')
            .toUTC();
        if ((nextPost.toSeconds() + bufferSecs) <= now.toSeconds()) return null;
        else return nextPost
    }
}


export function getTemplateMeta(t: Database['public']['Tables']['session_templates']['Row']) {

    // Get dates:
    const nowInZone = DateTime.now().setZone(t.time_zone);
    const first = {
        date: dbIsoUtcToDateTime(t.starts_at_utc, t.time_zone),
        post: dbIsoUtcToDateTime(t.starts_at_utc, t.time_zone, t.post_before_ms)
    }

    // Get recurrence(s):
    const rule = t.rrule ? buildRule(t.rrule, first.date) : null;
    let recurrences: { next: DateTime, post: DateTime }[] = [];
    const recurrencesToInclude = 10;
    const getNextRecurrence = (from: DateTime) => {
        const nextJs = rule ? rule.after(from.toJSDate(), false) : null;
        const next = nextJs ? DateTime.fromJSDate(nextJs).setZone(t.time_zone).set({ hour: first.date.hour, minute: first.date.minute }).startOf('minute') : null;
        const post = next ? next.plus({ millisecond: t.post_before_ms }) : null;
        return { next, post }
    }
    if (rule) {
        for (let i = 0; i < recurrencesToInclude; i++) {
            let lastRepeat = recurrences.at(-1)
            const next = getNextRecurrence(lastRepeat?.next || nowInZone);
            if (!next.next ||
                next?.next?.hasSame(first.date, 'day')
            ) break;
            recurrences.push(next);
        }
    }

    // Get Bool Flags:
    const postsToday = (): boolean => {
        const fromRepeats = recurrences.some(r => r.post.hasSame(nowInZone, 'day'))
        const postStartToday = (first.post.hasSame(nowInZone, 'day'))
        return (fromRepeats || postStartToday)
    }
    const templateOutdated = (): boolean => {
        const nowInZone = DateTime.now().setZone(t.time_zone);

        // No recurrence (one-time template)
        if (!rule) {
            return nowInZone.toSeconds() >= first.post.toSeconds();
        }

        const { count, until } = rule.options;

        // Infinite rule (no end)
        if (!count && !until) {
            return false;
        }

        // Finite rule -> determine LAST post date
        let lastOccurrenceJs: Date | null = null;

        if (until) {
            // last occurrence before or equal to UNTIL
            lastOccurrenceJs = rule.before(until, true);
        } else if (count) {
            // COUNT-based rules must enumerate (safe because finite)
            const all = rule.all();
            lastOccurrenceJs = all.at(-1) ?? null;
        }

        if (!lastOccurrenceJs) return false;

        const lastStart = DateTime
            .fromJSDate(lastOccurrenceJs, { zone: 'utc' })
            .setZone(t.time_zone)
            .set({ hour: first.date.hour, minute: first.date.minute })
            .startOf('minute');

        const lastPost = lastStart.plus({ millisecond: t.post_before_ms });

        // Outdated if now is on or after last post day
        return nowInZone >= lastPost.startOf('day');
    };

    // Get Next UTC Post Date from Now:
    const nextPost = () => {
        // Determine if next post is from origin/first dates:
        if (first.post.toSeconds() >= nowInZone.toSeconds()) {
            // First/Origin post date will come first:
            return first.post // .toUTC().toISO()
        }
        // OR - Find Next Upcoming Recurrence Post Date:
        let closestDate: DateTime;
        for (const { post: postDate } of recurrences) {
            // If no base closest date:
            if (!closestDate) {
                closestDate = postDate;
                continue;
            }
            // Skip past post dates:
            if (postDate.toSeconds() < nowInZone.toSeconds()) {
                continue;
            }

            else {
                const curDif = (closestDate.toSeconds() - nowInZone.toSeconds())
                const thisDif = (postDate.toSeconds() - nowInZone.toSeconds())
                if (thisDif < curDif) {
                    closestDate = postDate;
                }
            }
        }
        return closestDate;
    }

    // See any issues with this logic that computes the template/sessions schedules next POST time?
    // or any refinements I should/will appreatice later to have made?
    // ill use this as I load my session templates from db -> compute its meta -> post (internally) AND update the db for its "Next Post time utc"
    // but.... my mind is definitely already thinking about this stuff...:
    // if I do run a cron that fetches all templates by that "next_post_utc" field...
    // ill need to make sure that this util it ALWAYS giving back the correct next post time to save in DB... and also
    // the timing will have to be right for when I decide to actually scan / re-save its next post time of course too...
    // so please help me weed out any mix ups related/similar to that stuff.... cause if my cron "creation schedule" runs every 5 mins
    // (proably from random times due to server startup or I could define like each 5 mins of the hour? not sure which so I favor? I wouldnt want a huge logic / post /save load on each 5 min interval ofc)
    // but to ensure that no post time accidently dosent get created -> saved -> and then post obvi... that would break the WHOLE session / repeat / logic....
    // questions make sense? feel free to ask more questions to claify


    return {
        /** Contains the templates FIRST start/post date(s)
         * @note could be outdated from edits/recurrence */
        first,
        /** Contains an array of the template's next `start` & `post` dates by its schedule, if any. */
        recurrences,
        /** Raw `RRule` schedule for this template that's currently used. */
        rule,
        /** `Boolean` representing weather this session will be posted in its selected time zone today. */
        postsToday: postsToday(),
        /** `Object` containing this session templates next post times, from current time in zone. (if any) */
        nextPost: nextPost(),
        /** `Boolean` if this session template has already past its last post date in its time zone. */
        templateOutdated: templateOutdated(),
    }
}