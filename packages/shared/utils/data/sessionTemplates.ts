import { DateTime } from "luxon";
import type { Database } from "../../types";

// Env Safe - RRule Package Imports:
import * as rrule from "rrule";
type RRuleExports = {
    RRule: typeof import("rrule").RRule;
    rrulestr: typeof import("rrule").rrulestr;
    datetime: typeof import("rrule").datetime;
};
// Runtime-safe resolution
const resolved: RRuleExports = (rrule as any).default
    ? (rrule as any).default // Backend / Node / tsx
    : (rrule as any); // Frontend / Vite / ESM
export const { RRule, rrulestr, datetime } = resolved;




// -------[  FRONTEND --> BACKEND UTILITIES  ]-------

/** Converts a local JavaScript (Form) `Date` to a `DateTime` in the UTC zone. 
 * @note Trims to beginning of minute */
export function utcDateTimeFromJs(date: Date, zone: string) {
    const base = DateTime.fromJSDate(date);
    const start = DateTime.fromObject({
        year: base.year,
        month: base.month,
        day: base.day,
        hour: base.hour,
        minute: base.minute
    })
        .setZone(zone, { keepLocalTime: true })
        .startOf('minute');
    return start.toUTC();
}


// -------[  BACKEND --> FRONTEND UTILITIES  ]-------

/** Converts a database ISO string to a JavaScript `Date` in LOCAL zone 
 * @note Includes time from ISO in specified zone. (overrides local zone) */
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


/** Converts a database ISO string to a `DateTime` in specified zone. */
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


/** Maps RSVPs from `JSON` string data from database.  */
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

/** Builds an `RRule` from RRule string and origin start time from template.
 * @deprecated - RRules should be stable enough to be built directly from string! *(fingers crossed)* */
export function buildRule(rrule: string, start: DateTime): rrule.RRule {
    const base = RRule.fromString(rrule);
    const startUTC = start.toUTC().startOf('minute')
    return new RRule({
        ...base.options,
        byhour: startUTC.hour,
        byminute: startUTC.minute,
        bysecond: 0,
        dtstart: datetime(startUTC.year, startUTC.month, startUTC.day, startUTC.hour, startUTC.minute, 0),
        tzid: 'UTC'
    });
}

/** Calculate the next UCT Post Time for a session template. 
 * @returns A `DateTime` of the next post time after `referenceDate` in UTC. */
export function calculateNextPostUTC(opts: {
    /** `DateTime` of the templates FIRST start date in UTC. */
    startDate: DateTime,
    /** The post offset in milliseconds as negative number from session start time. */
    postOffsetMs: number,
    /** The time zone string assigned to this session/dates */
    zone: string,
    /** The `RRule` recurrence string for session repeats, if any. */
    rrule?: string | null,
    /** The reference `DateTime` to only search for next post dates ***AFTER***(and including) this date, if undefined defaults to current time in zone. 
     * @note `zone` should be set to 'utc'!
    */
    referenceDate?: DateTime
}) {
    // Get Options:
    let { startDate, postOffsetMs, zone, rrule, referenceDate = DateTime.now().toUTC() } = opts;
    startDate = startDate
        .startOf('minute')
        .toUTC();
    referenceDate = referenceDate
        .startOf('minute')
        .toUTC();

    // FIRST possible post ever
    const firstPostUtc = startDate.plus({ milliseconds: postOffsetMs }).startOf('minute');

    // ---- ONE-TIME TEMPLATE ----
    if (!rrule) {
        return firstPostUtc > referenceDate ? firstPostUtc : null;
    }

    // ---- RECURRING TEMPLATE ----
    // const rule = buildRule(rrule, startDate);
    const rule = rrule ? RRule.fromString(rrule) : null;
    if (!rule) return null;

    // Search RRule for next start -> post:
    const searchFrom = DateTime
        .max(firstPostUtc, referenceDate)
        .startOf('minute')
    const nextStartJs = rule.after(datetime(searchFrom.year, searchFrom.month, searchFrom.day, searchFrom.hour, searchFrom.minute, 0), true);
    if (!nextStartJs) return null;

    // Get Post from next Start Date:
    let nextStartUtc = DateTime.fromJSDate(nextStartJs).toUTC();
    return nextStartUtc.plus({ milliseconds: postOffsetMs }).startOf('minute');
}

/** Calculate the LAST UCT Post Time for a session template, effectively its expiration. 
 * @returns A `DateTime` of the templates "expiration date" in UTC. (will be deleted from *db* past this date) */
export function calculateExpiresAtUTC(opts: {
    startDate: DateTime
    postOffsetMs: number
    zone: string
    rrule?: string | null
}) {
    let { startDate, postOffsetMs, rrule } = opts;

    startDate = startDate.startOf('minute').toUTC();

    // First post ever
    const firstPostUtc = startDate.plus({ milliseconds: postOffsetMs });

    // ---- ONE-TIME TEMPLATE ----
    if (!rrule) {
        return firstPostUtc;
    }

    // const rule = buildRule(rrule, startDate);
    const rule = rrule ? RRule.fromString(rrule) : null;
    if (!rule) return null;

    const { count, until } = rule.options;

    // ---- INFINITE TEMPLATE ----
    if (!count && !until) {
        return null;
    }

    let lastStartJs: Date | null = null;

    if (until) {
        lastStartJs = rule.before(until, true);
    } else if (count) {
        const all = rule.all();
        lastStartJs = all.at(-1) ?? null;
    }

    if (!lastStartJs) return null;

    console.info({ lastStartJs })

    const lastStartUtc = DateTime
        .fromJSDate(lastStartJs)
        .toUTC()
        .startOf('minute');

    return lastStartUtc
        .plus({ milliseconds: postOffsetMs })
        .startOf('minute')
    // .plus({ hour: 12 }) // expiration buffer of 12 hours from last post
}



// ! IGNORE FOR NOW - OLD LOGIC (maybe some good stuff lol)
/** Parses template data from database and returns relevant information related to its states/occurrences. */
export function getTemplateMeta(t: Database['public']['Tables']['session_templates']['Row']) {

    // Get dates:
    const nowInZone = DateTime.now().setZone(t.time_zone);
    const first = {
        date: dbIsoUtcToDateTime(t.starts_at_utc, t.time_zone),
        post: dbIsoUtcToDateTime(t.starts_at_utc, t.time_zone, t.post_before_ms)
    }

    // Get recurrence(s):
    // const rule = t.rrule ? buildRule(t.rrule, first.date) : null;
    const rule = t.rrule ? RRule.fromString(t.rrule) : null;
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
            recurrences.push(next as any);
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
        let closestDate: DateTime | null = null;
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
            // Compute/Assign Closest Date:
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
        /** `DateTime` containing this session templates next post time, from current time in selected zone. (if any) */
        nextPost: nextPost(),
        /** `Boolean` if this session template has already past its last post date in its time zone. 
         * @note this will mark the template for deletion */
        templateOutdated: templateOutdated(),
    }
}