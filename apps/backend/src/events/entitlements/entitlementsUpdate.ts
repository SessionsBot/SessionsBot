import { Entitlement, Events } from "discord.js";
import discordLog from "../../utils/logs/discord.js";
import { useLogger } from "../../utils/logs/logtail.js";
import { supabase } from "../../utils/database/supabase.js";
import { DateTime } from "luxon";
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
        discordLog.events.entitlementCreated(newSku);

        // Add/Update Entitlement to DB:
        await updateEntitlementToDatabase(newSku)
    }
}
