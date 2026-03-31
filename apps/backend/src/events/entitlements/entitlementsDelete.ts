import { Entitlement, Events } from "discord.js";
import { sendDiscordLog } from "../../utils/logs/discord.js";
import { useLogger } from "../../utils/logs/logtail.js";
import { updateEntitlementToDatabase } from "../../utils/bot/entitlements.js";

const createLog = useLogger();

export default {
    name: Events.EntitlementDelete,
    async execute(sku: Entitlement) {
        // Log:
        createLog.for('Entitlements').info(`Entitlement DELETED - Active: ${sku?.isActive()}`, {
            guildId: sku?.guildId,
            userId: sku?.userId,
            sku
        })
        sendDiscordLog.events.entitlementCreated(sku);

        // Add/Update Entitlement to DB:
        await updateEntitlementToDatabase(sku)
    }
}
