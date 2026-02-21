import { API } from "@/utils/api";
import { supabase } from "@/utils/supabase";
import { SubscriptionLevel, type APIResponseValue, type SubscriptionPlanName } from "@sessionsbot/shared";
import { DateTime } from "luxon";


// Guild Channels:
export async function fetchGuildChannels(guildId: string | null, accessToken: string | undefined) {
    // Confirm Inputs:
    if (!guildId) return Promise.reject({ message: `[!] Failed to Fetch - Guild Channels - Missing "guildId".` })
    if (!accessToken) return Promise.reject({ message: `[!] Failed to Fetch - Guild Channels - Missing "accessToken".` })
    // Make API Request:
    const { data: apiResult } = await API.get<APIResponseValue<{ all: any[], sendable: any[] }>>(`/guilds/${guildId}/channels`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    // Return Result:
    if (apiResult?.success) {
        return apiResult.data;
    } else {
        return Promise.reject({ message: `[!] Failed to Fetch - Guild Channels - API ERROR`, response: apiResult })
    }
}


// Guild Roles:
export async function fetchGuildRoles(guildId: string | null, accessToken: string | undefined) {
    // Confirm Inputs:
    if (!guildId) return Promise.reject({ message: `[!] Failed to Fetch - Guild Roles - Missing "guildId".` })
    if (!accessToken) return Promise.reject({ message: `[!] Failed to Fetch - Guild Roles - Missing "accessToken".` })
    // Make API Request:
    const { data: apiResult } = await API.get<APIResponseValue<any[]>>(`/guilds/${guildId}/roles`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    // Return Result:
    if (apiResult?.success) {
        return apiResult.data;
    } else {
        return Promise.reject({ message: `[!] Failed to Fetch - Guild Roles - API ERROR`, response: apiResult })
    }
}


// Guild Subscription:
export async function fetchGuildSubscription(guildId: string | null, accessToken: string | undefined) {
    // Confirm Inputs:
    if (!guildId) return Promise.reject({ message: `[!] Failed to Fetch - Guild Subscription - Missing "guildId".` })
    if (!accessToken) return Promise.reject({ message: `[!] Failed to Fetch - Guild Subscription - Missing "accessToken".` })
    // Make API Request:
    const { data: apiResult } = await API.get<APIResponseValue<{ plan: SubscriptionPlanName, entitlements: any }>>(`/guilds/${guildId}/subscription`, {
        headers: { Authorization: `Bearer ${accessToken}` }
    })
    // Return Result:
    if (apiResult?.success) {
        if (apiResult.data?.plan == 'ENTERPRISE') return SubscriptionLevel.ENTERPRISE
        else if (apiResult.data?.plan == 'PREMIUM') return SubscriptionLevel.PREMIUM
        else return SubscriptionLevel.FREE
    } else {
        return Promise.reject({ message: `[!] Failed to Fetch - Guild Subscription - API ERROR`, response: apiResult })
    }
}


// Guild Preferences/Data:
export async function fetchGuildData(guildId: string | null) {
    // Confirm Inputs:
    if (!guildId) return Promise.reject({ message: `[!] Failed to Fetch - Guild Data / Preferences - Missing "guildId".` })
    // Make API Request:
    const { data, error } = await supabase.from('guilds')
        .select('*')
        .eq('id', guildId)
        .single()
    // Return Result:
    if (!error) {
        return data
    } else {
        return Promise.reject({ message: `[!] Failed to Fetch - Guild Data / Preferences - DB ERROR`, error })
    }
}


// Guild Stats Data:
export async function fetchGuildStats(guildId: string | null) {
    // Confirm Inputs:
    if (!guildId) return Promise.reject({ message: `[!] Failed to Fetch - Guild Stats - Missing "guildId".` })
    // Make API Request:
    const { data, error } = await supabase.from('guild_stats')
        .select('*')
        .eq('guild_id', guildId)
        .single()
    // Return Result:
    if (!error) {
        return data
    } else {
        return Promise.reject({ message: `[!] Failed to Fetch - Guild Stats - DB ERROR`, error })
    }
}


// Guild Templates:
export async function fetchGuildTemplates(guildId: string | null) {
    // Confirm Inputs:
    if (!guildId) return Promise.reject({ message: `[!] Failed to Fetch - Guild Templates - Missing "guildId".` })
    // Make API Request:
    const { data, error } = await supabase.from('session_templates')
        .select('*')
        .eq('guild_id', guildId)
        // .eq('enabled', true)
        .or(
            `expires_at_utc.gte.${DateTime.now().toISO()},expires_at_utc.is.null`
        )
    // Return Result:
    if (!error) {
        return data
    } else {
        return Promise.reject({ message: `[!] Failed to Fetch - Guild Templates - DB ERROR`, error })
    }
}


// Guild Sessions:
export async function fetchGuildSessions(guildId: string | null) {
    // Confirm Inputs:
    if (!guildId) return Promise.reject({ message: `[!] Failed to Fetch - Guild Sessions - Missing "guildId".` })
    // Make API Request:
    const { data, error } = await supabase.from('sessions')
        .select('*')
        .eq('guild_id', guildId)
    // Return Result:
    if (!error) {
        return data
    } else {
        return Promise.reject({ message: `[!] Failed to Fetch - Guild Sessions - DB ERROR`, error })
    }
}


// Guild Audit Log:
export async function fetchGuildAuditLog(guildId: string | null) {
    // Confirm Inputs:
    if (!guildId) return Promise.reject({ message: `[!] Failed to Fetch - Guild Audit Log - Missing "guildId".` })
    // Make API Request:
    const { data, error } = await supabase.from('audit_logs')
        .select('*')
        .eq('guild_id', guildId)
    // Return Result:
    if (!error) {
        return data
    } else {
        return Promise.reject({ message: `[!] Failed to Fetch - Guild Audit Log - DB ERROR`, error })
    }
}