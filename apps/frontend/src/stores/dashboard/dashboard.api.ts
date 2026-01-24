import { API } from "@/utils/api";
import { supabase } from "@/utils/supabase";
import { SubscriptionLevel, type APIResponseValue, type SubscriptionPlanName } from "@sessionsbot/shared";
import { DateTime } from "luxon";




export const fetchChannels = async (guild_id: string, access_token: string | undefined) => {
    // Confirm Inputs
    if (!guild_id) throw new Error(`[!] Failed to fetch Guild Channels - Missing guild id!`);
    if (!access_token) throw new Error(`[!] Failed to fetch Guild Channels - Missing access token!`);
    // Make API Request
    const { data: apiResult } = await API.get<APIResponseValue<{ all: any[], sendable: any[] }>>(`/guilds/${guild_id}/channels`, {
        headers: { Authorization: `Bearer ${access_token}` }
    })
    // Confirm Results
    if (apiResult?.success) {
        return apiResult.data;
    } else {
        console.error('[!] Failed to fetch Guild Channels - API - See Details', { apiResult })
        throw new Error(`[!] Failed to fetch Guild Channels - API Request Failed!`);
    }
}


export const fetchRoles = async (guild_id: string, access_token: string | undefined) => {
    // Confirm Inputs
    if (!guild_id) throw new Error(`[!] Failed to fetch Guild Roles - Missing guild id!`);
    if (!access_token) throw new Error(`[!] Failed to fetch Guild Roles - Missing access token!`);
    // Make API Request
    const { data: apiResult } = await API.get<APIResponseValue<any[]>>(`/guilds/${guild_id}/roles`, {
        headers: { Authorization: `Bearer ${access_token}` }
    })
    // Confirm Results
    if (apiResult?.success) {
        return apiResult.data;
    } else {
        console.error('[!] Failed to fetch Guild Roles - API - See Details', { apiResult })
        throw new Error(`[!] Failed to fetch Guild Roles - API Request Failed!`);
    }
}


export const fetchSubscription = async (guild_id: string, access_token: string | undefined) => {
    // Confirm Inputs
    if (!guild_id) throw new Error(`[!] Failed to fetch Guild Roles - Missing guild id!`);
    if (!access_token) throw new Error(`[!] Failed to fetch Guild Roles - Missing access token!`);
    // Make API Request
    const { data: apiResult } = await API.get<APIResponseValue<{ plan: SubscriptionPlanName, entitlements: any }>>(`/guilds/${guild_id}/subscription`, {
        headers: { Authorization: `Bearer ${access_token}` }
    });
    // Confirm Results
    if (apiResult?.success) {
        if (apiResult.data?.plan == 'ENTERPRISE') return SubscriptionLevel.ENTERPRISE
        else if (apiResult.data?.plan == 'PREMIUM') return SubscriptionLevel.PREMIUM
        else return SubscriptionLevel.FREE
    } else {
        console.error('[!] Failed to fetch Guild Roles - API - See Details', { apiResult })
        throw new Error(`[!] Failed to fetch Guild Roles - API Request Failed!`);
    }
}


export const fetchTemplates = async (guild_id: string) => {
    // Confirm Inputs
    if (!guild_id) throw new Error(`[!] Failed to fetch Guild Roles - Missing guild id!`);
    // Make DB Request
    const { data, error } = await supabase.from('session_templates')
        .select('*')
        .eq('guild_id', guild_id)
        .or(
            `expires_at_utc.gte.${DateTime.now().toISO()},expires_at_utc.is.null`
        )
    // Confirm Results
    if (!error) {
        return data
    } else {
        console.error('[!] Failed to fetch Guild Roles - API - See Details', { error })
        throw new Error(`[!] Failed to fetch Guild Roles - API Request Failed!`);
    }
}