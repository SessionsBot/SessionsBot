import { API } from "@/utils/api";
import type { APIResponseValue } from "@sessionsbot/shared";
import useDashboardStore from "./dashboard";
import { useAuthStore } from "../auth";

export function useGuildSubscription() {
    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();

    // Fetch Promise:
    const fetchSubscription = async () => {
        console.info(`Fetching current subscription for ${dashboard.guild.id}`);
        const access_token = auth?.session?.access_token;
        if (!access_token) {
            console.warn('[!] Failed to fetch guild subscription - No access token provided from auth user!');
            return null;
        }
        const { data: subscriptionResult } = await API.get<APIResponseValue>(`/guilds/${dashboard.guild.id}/subscription`, { headers: { Authorization: `Bearer ${auth?.session?.access_token}` } })
        if (!subscriptionResult?.success) {
            console.warn('[!] Failed to fetch guild subscription - API Request Failed', subscriptionResult);
            return null;
        } else {
            console.info(`Guild Subscription`, subscriptionResult.data);
            dashboard.guild.subscription = subscriptionResult.data as any;
            return subscriptionResult.data as { all: any, sendable: any };
        }
    }

    // Async State:
    const asyncState = useAsyncState(fetchSubscription(), null, { immediate: false });

    // Auto Update - On guild change:
    watch(() => dashboard.guild.id, (id) => {
        if (id) asyncState.execute();
    }, { immediate: true })

    // Return Results/State:
    return {
        ...asyncState,
        subscription: dashboard.guild.subscription
    }
}