import { API } from "@/utils/api";
import { SubscriptionLevel, type APIResponseValue, type SubscriptionPlanName } from "@sessionsbot/shared";
import useDashboardStore from "./dashboard";
import { useAuthStore } from "../auth";

export function useGuildSubscription() {
    // Services:
    const dashboard = useDashboardStore();
    const auth = useAuthStore();

    // Fetch Promise:
    const fetchSubscription = async () => {
        const access_token = auth?.session?.access_token;
        if (!access_token) {
            console.warn('[!] Failed to fetch guild subscription - No access token provided from auth user!');
            return null;
        }
        if (!dashboard.guild.id) {
            throw new Error(`[!] Failed to fetch guild subscription - No guild id selected within dashboard!`);
        }
        // GET - Entitlements from Backend API:
        const { data: subscriptionResult } = await API.get<APIResponseValue<{
            plan: SubscriptionPlanName,
            entitlements: any
        }>>(`/guilds/${dashboard.guild.id}/subscription`, {
            headers: {
                Authorization: `Bearer ${auth?.session?.access_token}`
            }
        });
        if (!subscriptionResult?.success) {
            console.warn('[!] Failed to fetch guild subscription - API Request Failed', subscriptionResult);
            return null;
        } else {
            console.info(`Guild Subscription`, subscriptionResult.data);
            if (subscriptionResult.data?.plan == 'FREE') {
                dashboard.guild.subscription = SubscriptionLevel.FREE
            } else if (subscriptionResult.data?.plan == 'PREMIUM') {
                dashboard.guild.subscription = SubscriptionLevel.PREMIUM
            } else if (subscriptionResult.data?.plan == 'ENTERPRISE') {
                dashboard.guild.subscription = SubscriptionLevel.ENTERPRISE
            } else {
                console.warn("Unknown Subscription Type/Level!", subscriptionResult.data)
                dashboard.guild.subscription = SubscriptionLevel.FREE
            }

            return subscriptionResult.data;
        }
    }

    // Async State:
    const asyncState = useAsyncState(fetchSubscription, null, { immediate: false });

    // Auto Update - On guild change:
    watch(() => dashboard.guild.id, (id) => {
        if (id) asyncState.execute();
        else dashboard.guild.subscription = SubscriptionLevel.FREE;
    }, { immediate: true })

    // Return Results/State:
    return {
        ...asyncState,
        subscription: dashboard.guild.subscription
    }
}