import { DateTime } from "luxon";
import { RRule } from 'rrule'

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

export function getDurationMs(start: DateTime, end: DateTime) {
    return (end.toMillis() - start.toMillis());
}

export function getPostOffsetMsFromJs(opts: {
    startDate: Date
    postTime: Date
    postDay: 'Day before' | 'Day of'
    zone: string
}): number {
    const { startDate, postTime, postDay, zone } = opts

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

    if (postDay === 'Day before') {
        post = post.minus({ days: 1 })
    }

    const offsetMs = post.toUTC().toMillis() - start.toUTC().toMillis()

    // Safety clamp
    return Math.min(offsetMs, 0)
}

export function calculateNextPostUTC(start: Date, zone: string, post_before_ms: number, rrule?: string | null,) {
    const today = DateTime.now().setZone(zone).startOf('day');
    const now = DateTime.now().setZone(zone);
    const first = utcDateFromJs(start, zone);
    const rule = rrule
        ? new RRule({
            ...RRule.fromString(rrule).options,
            dtstart: first.toJSDate(),
        })
        : null;
    const bufferSecs = (5 * 60) // 5 mins

    // If no rule/recurrence:
    if (!rule) {
        // If last post - past today:
        const post = first.plus({ milliseconds: post_before_ms })
        if ((post.toSeconds() + bufferSecs) <= now.toSeconds()) {
            // last post already occurred
            return null
        } else {
            return post
        }
    } else {
        // Determine rule dates:
        const next = rule.after(today.toJSDate(), true)
        if (!next) return null;
        const nextPost = DateTime.fromJSDate(next).setZone(zone).set({ hour: first.hour, minute: first.minute, second: 0, millisecond: 0 }).plus({ millisecond: post_before_ms })
        if ((nextPost.toSeconds() + bufferSecs) <= now.toSeconds()) return null;
        else return nextPost
    }
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