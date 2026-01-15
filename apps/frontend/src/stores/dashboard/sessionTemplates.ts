import { supabase } from "@/utils/supabase";
import { useAuthStore } from "../auth";
import useDashboardStore from "./dashboard";
import type { Database } from "@sessionsbot/shared";
import { DateTime } from "luxon";
import { RRule } from "rrule";

// Main Module:
export function useSessionTemplates() {
    // Services:
    const auth = useAuthStore();
    const dashboard = useDashboardStore();

    // Fetch Promise:
    async function fetchTemplates() {
        // Run Checks & Fetch Base Data:
        if (!dashboard.guild.id) {
            console.warn(`[!] Failed to fetch Session Templates - No selected guild id provided!`);
            return null;
        }
        const { data, error } = await supabase.from('session_templates')
            .select('*')
            .eq('guild_id', dashboard.guild.id)
        if (!data) {
            console.info('Session Template Fetch - returned null data');
            return null;
        }
        if (error) {
            console.warn(`[!] Failed to fetch Session Templates - Returned Supabase ERROR!`, error);
            return null;
        }
        // Filter Data:
        function transformTemplate(template: Database['public']['Tables']['session_templates']['Row']) {
            const startsAt = DateTime.fromISO(template.starts_at_utc, { zone: 'utc' });
            const postsAt = startsAt.plus({ milliseconds: template.post_before_ms });

            const isRecurring = !!template.rrule
            const rule = isRecurring ? RRule.fromString(template.rrule as string) : null;
            const thisMonthOccurrences = rule
                ? rule.between(
                    DateTime.now().set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                    DateTime.now().plus({ month: 1 }).set({ hour: 0, minute: 0, second: 0, millisecond: 0 }).toJSDate(),
                    true
                ).map((d) => {
                    const day = DateTime.fromJSDate(d);
                    const { hour, minute } = startsAt.setZone(template.time_zone)
                    const fullDate = day.set({ hour, minute, second: 0, millisecond: 0 })
                    return fullDate.toJSDate()
                })
                : null;

            return {
                ...template,
                meta: {
                    hasStarted: startsAt <= DateTime.now(),
                    hasPosted: postsAt <= DateTime.now(),
                    isRecurring,
                    rule,
                    thisMonthOccurrences
                }
            }
        }
        const result = data.map((t) => transformTemplate(t))


        dashboard.guild.sessionTemplates = result as any;
        return result
    };

    // Async State:
    const asyncState = useAsyncState(fetchTemplates, null, { immediate: false });

    // Auto Update - On Guild Select:
    watch(() => dashboard.guild.id, (id) => {
        if (id) asyncState.execute()
        else dashboard.guild.sessionTemplates = null;
    }, { immediate: true })

    // Return Results/State:
    return {
        ...asyncState,
        templates: dashboard.guild.sessionTemplates
    }
}