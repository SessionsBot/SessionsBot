import { Entitlement, Events } from "discord.js";
import discordLog from "../../utils/logs/discordLog.js";
import { useLogger } from "../../utils/logs/logtail.js";
import { supabase } from "../../utils/database/supabase.js";
import { DateTime } from "luxon";

const createLog = useLogger();

export default {
    name: Events.EntitlementUpdate,
    async execute(oldSku: Entitlement | null, newSku: Entitlement) {

        const sku = newSku

        // SKU Status:
        const resolveStatus = () => {
            if (sku.isTest()) return 'ACTIVE'
            if (sku.deleted) return 'CANCELED'
            if (!sku.endsAt) return 'CANCELED'

            return DateTime.now() >= DateTime.fromJSDate(sku.endsAt)
                ? 'EXPIRED'
                : 'ACTIVE'
        }

        // Log:
        console.info(`[~] ENTITLEMENT UPDATED!`, { oldSku, newSku })

        // Add Entitlement to DB:
        const { error: dbError } = await supabase.from('entitlements').upsert({
            id: sku.id,
            sku_id: sku.skuId,
            status: resolveStatus(),
            guild_id: sku?.guildId || sku?.guild?.id,
            starts_at: DateTime.fromJSDate(sku.startsAt).toISO(),
            ends_at: DateTime.fromJSDate(sku.endsAt).toISO(),
        })
        if (dbError) {
            createLog.for('Database').error('Failed to UPDATE an entitlement within database! - See Details', { err: dbError, entitlement: sku })
        }

    }
}
