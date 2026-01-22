import { API } from "@/utils/api";
import type { APIResponseValue } from "@sessionsbot/shared";
import useDashboardStore from "./dashboard";
import { useAuthStore } from "../auth";

export function useGuildRoles() {
    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();

    // Fetch Promise:
    const fetchRoles = async () => {
        const access_token = auth?.session?.access_token;
        if (!access_token) {
            throw new Error('[!] Failed to fetch guild roles - No access token provided from auth user!');
        }
        if (!dashboard.guild.id) {
            throw new Error(`[!] Failed to fetch guild roles - No guild id selected within dashboard!`);
        }
        const { data: rolesResult } = await API.get<APIResponseValue>(`/guilds/${dashboard.guild.id}/roles`, { headers: { Authorization: `Bearer ${auth?.session?.access_token}` } })
        if (!rolesResult?.success) {
            console.warn('Roles API Request Failed!', rolesResult)
            throw new Error('[!] Failed to fetch guild roles - API Request Failed');
        } else {
            dashboard.guild.roles = rolesResult.data as any;
            return rolesResult.data;
        }
    }

    // Async State:
    return useAsyncState(fetchRoles, null, {
        immediate: false, onError(e) {
            console.warn('[Guild Roles] API Request Error', e)
            dashboard.fetchErrors.roles = [e];
        },
    });
}