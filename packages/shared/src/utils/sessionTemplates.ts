import { DateTime } from "luxon";

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



const debugNextPostResult = true
/** Calculates a session template schedule's **NEXT POST** `DateTime` in UTC zone.
 * @returns - {@linkcode DateTime} in `UTC`
 * @version - 3.2 */
export function getSchedulesNextPostUTC(opts: {
    /** The sessions first start date in `UTC` zone as {@linkcode DateTime}. */
    firstStartUtc: DateTime,
    /** Post offset in positive milliseconds from the sessions start time. */
    postOffsetMs: number,
    /** The time zone used for this schedule
     * @ex - "America/Chicago" */
    timeZone: string,
    /** The {@linkcode RRule} `String` representing this sessions scheduled start dates. */
    RRule: string | undefined | null,
    /** Search for the next **POST DATE** __*after or equal*__ to this date.
     * @TimeZone Use `UTC` Date 
     * @Note If there is ***no post date*** after `this` {@linkcode DateTime} — Returns `null` */
    afterDate?: DateTime | undefined | null,

}): DateTime | null {

    // Get Search Dates/Vars:
    const firstPostUtc = opts.firstStartUtc.minus({ milliseconds: opts.postOffsetMs })
    const afterDate = opts.afterDate?.isValid ? opts.afterDate : DateTime.utc()
    const timeZone = opts?.timeZone

    // Debug:
    const debugDateResult = (d: DateTime | null) => ({
        utc: d?.toUTC()?.toISO(),
        zoned: d?.setZone(timeZone)?.toISO() + ' ' + timeZone,
        local: d?.toLocal()?.toISO(),
    })
    if (debugNextPostResult) console.info(`[Next Post Calculation]:`, JSON.stringify({
        options: { ...opts, postOffsetHrs: ((opts.postOffsetMs ?? 0) / 1000 / 60 / 60) },
        firstPostUtc: firstPostUtc?.toISO(),
        afterDate: afterDate?.toISO()
    }, null, 2))

    // First post <= afterDate - Return First POST Date:
    if (firstPostUtc >= afterDate) {
        if (debugNextPostResult) console.info(`[Next Post Calculation]: (First Post >= afterDate) -> First Post`, debugDateResult(firstPostUtc,))
        return firstPostUtc
    }

    // No Recurrence - Return First POST Date:
    if (!opts.RRule) {
        const r = (firstPostUtc >= afterDate) ? firstPostUtc : null;
        if (debugNextPostResult) console.info(`[Next Post Calculation]: No RECURRENCE -> (firstPost >= afterDate) -> First Post OR null`, debugDateResult(r))
        return r
    }

    // Get Original Recurrence Rule:
    const rule = rrulestr(opts.RRule, { forceset: false })


    // Util - Convert DateTime to RRule Striped Offset Date:
    const luxonToRRuleDate = (d: DateTime) => (datetime(d.year, d.month, d.day, d.hour, d.minute, 0))

    // Util - Adjust Until Date (if any) for Post Schedule RRule:
    const adjustUntilDate = (d: Date | undefined, z: string) => {
        if (d) {
            const orgUntilDate = rruleDateToLuxon(d, z)
            return luxonToRRuleDate(orgUntilDate?.minus({ milliseconds: opts.postOffsetMs }))
        }
        else return undefined
    }


    // Recreate RRule w/ Panel Post Time Schedule:
    const firstPostInZone = firstPostUtc?.setZone(timeZone)
    const postRule = new RRule({
        freq: rule.options.freq,
        interval: rule.options.interval,
        byweekday: rule.options.byweekday,
        byhour: firstPostInZone.hour,
        byminute: firstPostInZone.minute,
        tzid: timeZone,
        dtstart: luxonToRRuleDate(firstPostInZone),
        count: rule.options.count,
        until: adjustUntilDate(rule.options.until, timeZone),
    })


    if (debugNextPostResult) console.info(`[Next Post Calculation]: RECREATED RRULE - Start -> Post Schedule\n`, postRule?.toString(), `\n---`)

    // Calc next post from after date:
    const zonedAfterDate = luxonToRRuleDate(afterDate?.setZone(timeZone)?.startOf('minute'))
    const nextResultJS = postRule.after(zonedAfterDate, true)
    if (!nextResultJS) {
        if (debugNextPostResult) console.warn(`[Next Post Calculation]: (!) Couldn't find next session post date from re-created RRule...`, { orgOpts: opts, postRule });
        return null;
    }
    const nextResultDT = rruleDateToLuxon(nextResultJS, timeZone)
    if (debugNextPostResult) console.info(`[Next Post Calculation]: RESULT (1) FROM NEW RULE`, debugDateResult(nextResultDT))
    if (debugNextPostResult && (nextResultDT < afterDate)) console.log('RESULT (1) - START FROM THIS POST', debugDateResult(nextResultDT?.plus({ milliseconds: opts.postOffsetMs })))

    // Safety Check- Confirm Result > After Date
    if (nextResultDT < afterDate) {
        // Invalid Result - Search for Next Post Date:
        if (debugNextPostResult) console.warn(`[Next Post Calculation]: (!) First Result Post Date WAS TOO EARLY -- Getting next recurrence...`)
        // Search for NEXT after LAST RESULT:
        const newResultJS = postRule.after(nextResultJS, false)
        if (!newResultJS) {
            // If new result = null:
            if (debugNextPostResult) console.warn(`[Next Post Calculation]: (!) Couldn't find next (after prev result) session post date from re-created RRule...`, { orgOpts: opts, postRule });
            return null;
        }
        // Parse & Check NEW Result:
        const newResultDT = rruleDateToLuxon(newResultJS, timeZone)
        if (newResultDT < afterDate && debugNextPostResult) console.warn('[Next Post Calculation]: (!) SECOND DATE RESULT IS STILL INVALID !!!! \n- Invalid Result:', debugDateResult(newResultDT));
        // Debug:
        if (debugNextPostResult) console.log('RESULT (2) FROM NEW RULE', debugDateResult(newResultDT))
        if (debugNextPostResult) console.log('RESULT (2) - START FROM THIS POST', debugDateResult(newResultDT?.plus({ milliseconds: opts.postOffsetMs })))
        // Return New Valid Result OR null:
        return (newResultDT < afterDate) ? null : newResultDT?.toUTC();

    } else
        // Return FIRST Valid Result OR null:
        return (nextResultDT < afterDate) ? null : nextResultDT?.toUTC();
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