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


/** Maps RSVPs from `JSON` string data from database to an `array`.  */
export function mapRsvps(rsvpJSON: any) {
    const parsed = JSON.parse(String(rsvpJSON));
    const rsvpsArray: {
        name: string,
        emoji?: string | null,
        capacity: number,
        required_roles?: string[]
    }[] = Array.from(parsed);
    return rsvpsArray;
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
    /** The time zone string assigned to this session/dates. */
    zone: string,
    /** The `RRule` recurrence string for session repeats, if any. */
    rrule?: string | null,
    /** The reference `DateTime` to only search for next post dates ***AFTER***(and including) this date, if undefined defaults to current time in zone. 
     * @note `zone` should be set to 'utc'!
    */
    referenceDate?: DateTime
}) {
    // Assign Reference Default if Null:
    if (!opts.referenceDate) opts.referenceDate = DateTime.now()
    // Get Intended Start Time of Day:
    const { hour: startHour, minute: startMinute } = opts.startDate.setZone(opts.zone)

    // Compute - Next Post UTC from Reference Date:
    let cursor = DateTime.now();
    let rule = opts.rrule ? RRule.fromString(opts.rrule) : null;
    while (true) {
        // Find Next Local Date in JS Date:
        const nextStartJs = rule ? rule.after(cursor.toJSDate(), true) : null;
        if (nextStartJs) {
            // Create DateTime in Zone w/ Post Offset of next recurrence:
            const nextStartInZone = DateTime.fromJSDate(nextStartJs, { zone: opts.zone })
                .set({ hour: startHour, minute: startMinute }); // maintain intended time
            const nextPostInZone = nextStartInZone.minus({ millisecond: opts.postOffsetMs });
            // Ensure this post date is past the specified `reference date`:
            if (nextPostInZone.toSeconds() <= opts.referenceDate.toSeconds()) {
                // This post was too early / already elapsed -> finding next
                cursor = cursor.plus({ day: 1 })
                continue
            }
            // Checks Passed - Return UTC Date:
            return nextPostInZone.toUTC();

        } else {
            // No Next Start Js?: - 
            const firstPost = opts.startDate.plus({ millisecond: opts.postOffsetMs })
            // Return First Post if not past now or null:
            if (firstPost.toUTC().toSeconds() > DateTime.now().toSeconds()) {
                return firstPost
            } else return null;
        };

    };

}

/** Calculate the LAST UCT Post Time for a session template, effectively its expiration. 
 * @returns A `DateTime` of the templates "expiration date" in UTC. (will be deleted from *db* past this date) */
export function calculateExpiresAtUTC(opts: {
    /** `DateTime` of the templates FIRST start date in UTC. */
    startDate: DateTime,
    /** The post offset in milliseconds as negative number from session start time. */
    postOffsetMs: number,
    /** The time zone string assigned to this session/dates. */
    zone: string,
    /** The `RRule` recurrence string for session repeats, if any. */
    rrule?: string | null,
}) {

    const startUtc = opts.startDate.toUTC();
    const startInZone = opts.startDate.setZone(opts.zone)
    const { hour: startHour, minute: startMinute } = startInZone;

    const rule = opts.rrule ? RRule.fromString(opts.rrule) : null;

    let lastStartJs: Date | null = null;

    if (!rule) {
        // No Recurrence:
        lastStartJs = startUtc
            .minus({ millisecond: opts.postOffsetMs })
            .toLocal()
            .toJSDate();
    } else {
        // Has Recurrence:
        const { until, count } = rule.options
        if (until) {
            // RRule End by Date:
            lastStartJs = rule.before(until, false);
        } else if (count) {
            // RRule End by Count:
            const all = rule.all();
            lastStartJs = all.at(-1) ?? null;
        } else {
            // No RRule End / Expiration Date:
            lastStartJs = null
        }
    }

    if (lastStartJs) {
        const lastStartInZone = DateTime.fromJSDate(lastStartJs, { zone: opts.zone })
            .set({ hour: startHour, minute: startMinute }); // maintain intended time
        const lastPostInZone = lastStartInZone.minus({ millisecond: opts.postOffsetMs });
        const expiresAtUtc = lastPostInZone.toUTC();
        return expiresAtUtc;
    } else {
        return null;
    }
}