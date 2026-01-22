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
            throw new Error(`[!] Failed to fetch guild channels - No access token provided from auth user!`);
        }
        if (!dashboard.guild.id) {
            throw new Error(`[!] Failed to fetch guild channels - No guild id selected within dashboard!`);
        }
        const { data: channelsResult } = await API.get<APIResponseValue>(`/guilds/${dashboard.guild.id}/channels`, { headers: { Authorization: `Bearer ${auth?.session?.access_token}` } })
        if (!channelsResult?.success) {
            console.warn('Channels API Request Failed!', channelsResult);
            throw new Error(`[!] Failed to fetch guild channels - API Request Failed!`);
        } else {
            dashboard.guild.channels = channelsResult.data as any;
            return channelsResult.data as { all: any, sendable: any };
        }
    }

    // Async State:
    return useAsyncState(fetchChannels, null, {
        immediate: false, onError(e) {
            console.warn('[Guild Channels] API Request Error', e)
            dashboard.fetchErrors.channels = [e];
        },
    });
}