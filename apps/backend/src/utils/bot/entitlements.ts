import { Entitlement, RESTGetAPIEntitlementsQuery, RESTGetAPIEntitlementsResult, Routes } from "discord.js";
import core from "../core/core";
import { useLogger } from "../logs/logtail";
import { SubscriptionLevel, SubscriptionSKUs } from "@sessionsbot/shared";
import { supabase } from "../database/supabase";
import { DateTime } from "luxon";

const createLog = useLogger();

/** Gets a Discord guild's current entitlements for Sessions Bot.
 * @note This excludes deleted and expired entitlements. */
export async function getGuildEntitlementsFromId(guildId: string) {
    try {
        // Get Vars/Bot Client:
        const { botClient: bot } = core;
        // Fetch from REST Api:
        const res: RESTGetAPIEntitlementsResult = await bot.rest.get(Routes.entitlements(bot.application.id), {
            query: new URLSearchParams(<RESTGetAPIEntitlementsQuery>{
                guild_id: guildId,
                exclude_ended: true
            } as any)
        }) as any
        // Confirm & Return Res:
        if (!res) throw { details: 'No API Response Received!', res };
        else return { success: true, entitlements: res };
    } catch (error) {
        // Log & Return Failure
        createLog.for('Bot').error(`Failed to fetch entitlements for a guild by id! - Guild: ${guildId}`, { error, guildId })
        return { success: false, error }
    }
}


/** Gets a Discord guild's current Sessions Bot `Subscription Level`.
 * @see {@link SubscriptionLevel} */
export async function getGuildSubscriptionFromId(guildId: string) {
    const { success, entitlements, error } = await getGuildEntitlementsFromId(guildId)
    if (!success) {
        // createLog.for('Bot').warn('Failed to fetch Guild Subscriptions - Entitlements API error!', { error })
        // ^ logged from results call!
        return SubscriptionLevel.FREE;
    } else {
        const ownedSKUs = entitlements.map(e => e.sku_id)
        if (ownedSKUs.includes(SubscriptionSKUs.ENTERPRISE)) return SubscriptionLevel.ENTERPRISE;
        else if (ownedSKUs.includes(SubscriptionSKUs.PREMIUM)) return SubscriptionLevel.PREMIUM;
        else return SubscriptionLevel.FREE;
    }
}


/** Used from Bot Client `Events` to sync entitlement changes to database. */
export async function updateEntitlementToDatabase(e: Entitlement) {

    try {
        // Make Db Req:
        const { error } = await supabase.from('entitlements').upsert({
            id: e.id,
            sku_id: e.skuId,
            guild_id: e?.guildId,
            is_active: e?.isActive(),
            is_test: e?.isTest(),
            starts_at: DateTime.fromJSDate(e?.startsAt, { zone: 'utc' }).toISO(),
            ends_at: DateTime.fromJSDate(e?.endsAt, { zone: 'utc' }).toISO()
        })
        if (error) throw error
        else return { success: true }
    } catch (err) {
        // Log Error:
        createLog.for('Database').error(`Failed to update an ENTITLEMENT within database!`, { guildId: e?.guildId, err })
        return { success: false }
    }

}