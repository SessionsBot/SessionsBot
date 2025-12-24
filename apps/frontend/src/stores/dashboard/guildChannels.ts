import { API } from "@/utils/api";
import type { APIResponseValue } from "@sessionsbot/shared";
import useDashboardStore from "./dashboard";
import { useAuthStore } from "../auth";

export function useGuildChannels() {
    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();

    // Fetch Promise:
    const fetchChannels = async () => {
        const access_token = auth?.session?.access_token;
        if (!access_token) {
            console.warn('[!] Failed to fetch guild channels - No access token provided from auth user!');
            return null;
        }
        const { data: channelsResult } = await API.get<APIResponseValue>(`/guilds/${dashboard.guild.id}/channels`, { headers: { Authorization: `Bearer ${auth?.session?.access_token}` } })
        if (!channelsResult?.success) {
            console.warn('[!] Failed to fetch guild channels - API Request Failed', channelsResult);
            return null;
        } else {
            dashboard.guild.channels = channelsResult.data as any;
            return channelsResult.data as { all: any, sendable: any };
        }
    }

    // Async State:
    const asyncState = useAsyncState(fetchChannels(), null, { immediate: false });

    // Auto Update - On guild change:
    watch(() => dashboard.guild.id, (id) => {
        if (id) asyncState.execute();
    }, { immediate: true })

    // Return Results/State:
    return {
        ...asyncState,
        channels: dashboard.guild.channels
    }
}