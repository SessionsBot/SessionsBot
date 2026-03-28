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
const resolved: RRuleExports = !!(rrule as any)?.default
    ? (rrule as any)?.default // Backend / Node / tsx
    : (rrule as any); // Frontend / Vite / ESM
export const { RRule, rrulestr, datetime } = resolved;



/** "Re-Maps" RSVP slot(s) `JSON` from database to a `typed array`.  */
export function mapRsvps(rsvpJSON: any) {
    const parsed = JSON.parse(JSON.stringify(rsvpJSON))
    const rsvpsArray: {
        name: string,
        emoji?: string | null,
        capacity: number,
        required_roles?: string[]
    }[] = Array.from(parsed);
    return rsvpsArray;
}


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


/** Converts a "malformed local/utc" `RRule date` to a specified timezone.
 * @note Used for js `date` objects __returned by the `RRule` package__! */
export function rruleDateToLuxon(jsDate: Date, tz: string) {
    return DateTime.fromObject({
        year: jsDate.getUTCFullYear(),
        month: jsDate.getUTCMonth() + 1,
        day: jsDate.getUTCDate(),
        hour: jsDate.getUTCHours(),
        minute: jsDate.getUTCMinutes(),
        second: jsDate.getUTCSeconds(),
    }, {
        zone: 'local'
    })
        ?.setZone(tz)
}


/** Calculates a session template schedule's **NEXT POST** `DateTime` in UTC zone. */
export function getSchedulesNextPostUTC(opts: {
    /** The sessions first start date in UTC zone as `DateTime`. */
    startsAtUtc: DateTime,
    /** Post offset in positive milliseconds from the sessions start time. */
    postOffsetMs: number,
    /** The RRule String representing this sessions schedule. */
    RRule: string | undefined | null,
    /** Search for the next post date AFTER this date 
     * @Default `DateTime.now()`
     * @TimeZone `UTC` */
    afterDate?: DateTime | undefined | null,

}): DateTime | null {

    // Get Search Dates:
    const firstPostDate = opts.startsAtUtc.minus({ milliseconds: opts.postOffsetMs })
    const afterDate = opts.afterDate?.isValid ? opts.afterDate : DateTime.utc()
    const adjustedSearchFrom = afterDate?.plus({ millisecond: opts.postOffsetMs })

    // Before First Start - Return FIRST Post:
    if (opts.startsAtUtc > DateTime.now()) {
        return firstPostDate
    }

    // No Recurrence - Return First (and last) POST Date:
    if (!opts.RRule) {
        return (firstPostDate >= afterDate) ? firstPostDate : null;
    }

    // Get Recurrence Rule:
    const rule = rrulestr(opts.RRule, { forceset: false })
    const timeZone = rule.options.tzid ?? "UTC"


    const nextStartJS = rule.after(adjustedSearchFrom?.setZone(timeZone)?.toJSDate(), true)
    if (!nextStartJS) return null
    const nextStartDT = rruleDateToLuxon(nextStartJS, timeZone)
    if (!nextStartDT) return null


    // Calculate next post date:
    const nextPostDT = nextStartDT.minus({ milliseconds: opts.postOffsetMs })
    if (nextPostDT < afterDate) {
        // Date TOO EARLY - Try Another Recurrence - or Return null:
        const secondStartJS = rule.after(nextStartJS, false)
        const secondStartDT = rruleDateToLuxon(secondStartJS, timeZone)
        const secondPostDT = secondStartDT?.minus({ millisecond: opts.postOffsetMs })
        if (secondPostDT < afterDate) {
            console.warn('(!) Calculated next post UTC date is BEFORE the requested after date!', nextPostDT?.setZone(timeZone)?.toFormat('f'))
            return null;
        } else {
            return secondPostDT?.toUTC()
        }
    } else {
        return nextPostDT?.toUTC()
    }
}


/** Calculates a session template schedule's **LAST POST** `DateTime` in UTC zone. */
export function getSchedulesLastPostUTC(opts: {
    /** The sessions first start date in UTC zone. */
    startsAtUtc: DateTime,
    /** Post offset in positive milliseconds from the sessions start time. */
    postOffsetMs: number,
    /** The RRule String representing this sessions schedule. */
    RRule: string | undefined | null,
}): DateTime | null {
    if (!opts.RRule) {
        // Return start date w/ post offset:
        return opts.startsAtUtc.minus({
            milliseconds: opts.postOffsetMs
        })
    } else {
        // Has recurrence(s) - Find last start w/ post offset:
        const rule = rrulestr(opts.RRule, { forceset: false });
        const { until, count } = rule.options
        const timeZone = rule.options.tzid ?? 'utc'
        let lastStartJs: Date | null = null
        if (until) {
            // RRule End by Date:
            lastStartJs = rule.before(until, true)

        } else if (count) {
            // RRule End by Count:
            const all = rule.all();
            lastStartJs = all.at(-1) ?? null;
        } else {
            // No RRule End / Expiration Date:
            lastStartJs = null
        }
        if (!lastStartJs) return null // no expiration
        else {
            // Found expiration date:
            const lastStartDT = rruleDateToLuxon(lastStartJs, timeZone)
            // Return in UTC w/ post offset:
            return lastStartDT?.minus({
                milliseconds: opts.postOffsetMs
            })?.toUTC()
        }
    }
}