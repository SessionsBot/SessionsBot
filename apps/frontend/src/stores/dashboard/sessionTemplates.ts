import { supabase } from "@/utils/supabase";
import { useAuthStore } from "../auth";
import useDashboardStore from "./dashboard";

export function useSessionTemplates() {
    // Services:
    const auth = useAuthStore();
    const dashboard = useDashboardStore();

    // Fetch Promise:
    async function fetchTemplates() {
        if (!dashboard.guild.id) {
            console.warn(`[!] Failed to fetch Session Templates - No selected guild id provided!`);
            return null;
        }
        const { data, error } = await supabase.from('session_templates')
            .select('*')
            .eq('guild_id', dashboard.guild.id)
            .select();
        if (!data) {
            console.info('Session Template Fetch - returned null data');
            return null;
        }
        if (error) {
            console.warn(`[!] Failed to fetch Session Templates - Returned Supabase ERROR!`, error);
            return null;
        }
        dashboard.guild.sessionTemplates = data as any;
        return data
    };

    // Async State:
    const asyncState = useAsyncState(fetchTemplates(), null, { immediate: false });

    // Auto Update - On Guild Select:
    watch(() => dashboard.guild.id, (id) => {
        if (id) asyncState.execute()
    }, { immediate: true })

    // Return Results/State:
    return {
        ...asyncState,
        templates: dashboard.guild.sessionTemplates
    }
}