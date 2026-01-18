import { Entitlement, Events } from "discord.js";
import discordLog from "../../utils/logs/discord.js";
import { useLogger } from "../../utils/logs/logtail.js";
import { supabase } from "../../utils/database/supabase.js";
import { DateTime } from "luxon";

const createLog = useLogger();

export default {
    name: Events.EntitlementCreate,
    async execute(sku: Entitlement) {

        // SKU Status:
        const resolveStatus = () => {
            if (sku?.isTest()) return 'ACTIVE'
            if (sku?.deleted) return 'CANCELED'
            if (!sku?.endsAt) return 'CANCELED'

            return DateTime.now() >= DateTime.fromJSDate(sku?.endsAt)
                ? 'EXPIRED'
                : 'ACTIVE'
        }

        // Log:
        createLog.for('Entitlements').info(`Entitlement Created - Active: ${sku?.isActive()}`, { entitlement: sku })
        discordLog.events.entitlementCreated(sku);

        // Add Entitlement to DB:
        const { error: dbError } = await supabase.from('entitlements').upsert({
            id: sku?.id,
            sku_id: sku?.skuId,
            status: resolveStatus(),
            guild_id: sku?.guildId || sku?.guild?.id,
            starts_at: DateTime.fromJSDate(sku?.startsAt).toISO(),
            ends_at: DateTime.fromJSDate(sku?.endsAt).toISO(),
        })
        if (dbError) {
            createLog.for('Database').error('Failed to SAVE an entitlement within database! - See Details', { err: dbError, entitlement: sku })
        }

    }
}
