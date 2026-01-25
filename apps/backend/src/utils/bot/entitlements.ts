import { RESTGetAPIEntitlementsQuery, RESTGetAPIEntitlementsResult, Routes } from "discord.js";
import core from "../core";
import { useLogger } from "../logs/logtail";
import { SubscriptionLevel, SubscriptionSKUs } from "@sessionsbot/shared";

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
        createLog.for('Bot').warn('Failed to fetch entitlements for a guild by id!', { error })
        return { success: false, error }
    }
}


/** Gets a Discord guild's current Sessions Bot `Subscription Level`.
 * @see {@link SubscriptionLevel} */
export async function getGuildSubscriptionFromId(guildId: string) {
    const { success, entitlements, error } = await getGuildEntitlementsFromId(guildId)
    if (!success) {
        createLog.for('Bot').warn('Failed to fetch Guild Subscriptions - Entitlements API error!', { error })
        return SubscriptionLevel.FREE;
    } else {
        const ownedSKUs = entitlements.map(e => e.sku_id)
        if (ownedSKUs.includes(SubscriptionSKUs.ENTERPRISE)) return SubscriptionLevel.ENTERPRISE;
        else if (ownedSKUs.includes(SubscriptionSKUs.PREMIUM)) return SubscriptionLevel.PREMIUM;
        else return SubscriptionLevel.FREE;
    }
}