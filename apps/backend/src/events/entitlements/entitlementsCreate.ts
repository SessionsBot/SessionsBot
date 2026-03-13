import { Entitlement, Events } from "discord.js";
import discordLog from "../../utils/logs/discord.js";
import { useLogger } from "../../utils/logs/logtail.js";
import { supabase } from "../../utils/database/supabase.js";
import { DateTime } from "luxon";
import { updateEntitlementToDatabase } from "../../utils/bot/entitlements.js";

const createLog = useLogger();

export default {
    name: Events.EntitlementCreate,
    async execute(sku: Entitlement) {
        // Log:
        createLog.for('Entitlements').info(`Entitlement Created - Active: ${sku?.isActive()}`, {
            guildId: sku?.guildId,
            userId: sku?.userId,
            sku
        })
        discordLog.events.entitlementCreated(sku);

        // Add/Update Entitlement to DB:
        await updateEntitlementToDatabase(sku)
    }
}
