import { supabase } from "@/utils/supabase";
import { useAuthStore } from "../auth";
import useDashboardStore from "./dashboard";
import type { Database } from "@sessionsbot/shared";
import { DateTime } from "luxon";
import { RRule } from "rrule";

// Main Module:
export function useGuildTemplates() {
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

        dashboard.guild.sessionTemplates = data as any;
        return data;
    };

    // Async State:
    return useAsyncState(fetchTemplates, null, {
        immediate: false, onError(e) {
            console.warn('[Guild Templates] API Request Error', e)
        },
    });

}