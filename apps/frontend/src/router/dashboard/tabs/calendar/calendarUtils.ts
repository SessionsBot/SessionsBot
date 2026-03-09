import { DateTime } from 'luxon';
import { RRule } from 'rrule';

type CalendarTemplateLike = {
    starts_at_utc: string;
    rrule?: string | null;
};

function inDayRangeByKey(dayKey: string, startKey: string, endKey: string) {
    return dayKey >= startKey && dayKey <= endKey;
}

export function dayKey(dt: DateTime | null | undefined) {
    return dt?.startOf('day').toISODate() ?? null;
}

export function isoToLocalDayKey(iso: string | null | undefined) {
    if (!iso) return null;
    const dt = DateTime.fromISO(iso, { zone: 'local' });
    return dayKey(dt);
}

export function parseRuleSafe(ruleText: string | null | undefined) {
    if (!ruleText) return null;
    try {
        return RRule.fromString(ruleText);
    } catch {
        return null;
    }
}

export function getTemplateDayMapForMonth<T extends CalendarTemplateLike>(
    templates: T[],
    monthStart: DateTime,
    monthEnd: DateTime,
    minDayInclusive: DateTime
) {
    const daysWithTemplates = new Set<string>();
    const templatesByDay = new Map<string, T[]>();
    const monthStartKey = dayKey(monthStart);
    const monthEndKey = dayKey(monthEnd);
    const minDayKey = dayKey(minDayInclusive);

    if (!monthStartKey || !monthEndKey || !minDayKey) {
        return { daysWithTemplates, templatesByDay };
    }

    const addTemplateToDay = (key: string, template: T) => {
        if (!inDayRangeByKey(key, monthStartKey, monthEndKey)) return;
        if (key < minDayKey) return;
        daysWithTemplates.add(key);
        const current = templatesByDay.get(key) ?? [];
        if (!current.includes(template)) {
            current.push(template);
            templatesByDay.set(key, current);
        }
    };

    for (const template of templates) {
        const templateStartKey = isoToLocalDayKey(template.starts_at_utc);
        if (templateStartKey) {
            addTemplateToDay(templateStartKey, template);
        }

        const rule = parseRuleSafe(template.rrule);
        if (!rule) continue;

        const occurrences = rule.between(
            monthStart.startOf('day').toJSDate(),
            monthEnd.endOf('day').toJSDate(),
            true
        );

        for (const occurrence of occurrences) {
            const key = dayKey(DateTime.fromJSDate(occurrence, { zone: 'local' }));
            if (!key) continue;
            addTemplateToDay(key, template);
        }
    }

    return { daysWithTemplates, templatesByDay };
}
