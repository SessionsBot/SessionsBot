import { Entitlement, Events } from "discord.js";
import { sendDiscordLog } from "../../utils/logs/discord.js";
import { useLogger } from "../../utils/logs/logtail.js";
import { updateEntitlementToDatabase } from "../../utils/bot/entitlements.js";

const createLog = useLogger();

export default {
    name: Events.EntitlementUpdate,
    async execute(oldSku: Entitlement | null, newSku: Entitlement) {
        // Log:
        createLog.for('Entitlements').info(`Entitlement Updated - Active: ${newSku?.isActive()}`, {
            guildId: newSku?.guildId,
            userId: newSku?.userId,
            newSku,
            oldSku
        })
        sendDiscordLog.events.entitlementCreated(newSku);

        // Add/Update Entitlement to DB:
        await updateEntitlementToDatabase(newSku)
    }
}
