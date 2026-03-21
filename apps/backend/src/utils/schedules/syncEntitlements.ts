import nodeCron from "node-cron";
import { useLogger } from "../logs/logtail";
import core from "../core/core";
import { EntitlementType, RESTGetAPIEntitlementsQuery, RESTGetAPIEntitlementsResult, Routes } from "discord.js";
import { SubscriptionSKUs } from "@sessionsbot/shared";
import { updateEntitlementToDatabase } from "../bot/entitlements";
import { supabase } from "../database/supabase";
import { DateTime } from "luxon";

const createLog = useLogger('[Entitlements Synchronization]:').for('Schedule');
const devGuildIds = [
    process.env?.['GUILD_ID_DEVELOPMENT'],
    '593097033368338435'
]

export function initializeEntitlementsSyncSchedule(runImmediately?: true) {

    const sch = nodeCron.schedule(`30 7 * * *`, async () => {
        try {
            createLog.info('Synchronizing Discord Entitlements to Database...')

            // Fetch ALL Entitlements from Discord API:
            const bot = core.botClient
            let cursor = undefined
            let resultCount = 0
            while (true) {

                const reqQuery = new URLSearchParams(<RESTGetAPIEntitlementsQuery>{
                    exclude_deleted: false,
                    sku_ids: `${SubscriptionSKUs.PREMIUM},${SubscriptionSKUs.ENTERPRISE}`,
                    limit: 100,
                    ...(cursor && { after: cursor })
                } as any)

                const results: RESTGetAPIEntitlementsResult = await bot.rest.get(Routes.entitlements(bot.application.id), { query: reqQuery }) as any
                resultCount += results?.length

                // Update Each SKU to Database:
                for (const e of results) {

                    // Util: Entitlement Active Bool:
                    const isActive = () => {
                        if (e.consumed || e.deleted) return false
                        else if (!e.ends_at || DateTime.fromISO(e.ends_at) > DateTime.utc()) return true
                        else return false
                    }
                    // Util: Entitlement Test/Dev Bool:
                    const isTest = () => (!e.starts_at && !e.ends_at) || (e.type == EntitlementType.TestModePurchase)

                    if (devGuildIds?.includes(e?.guild_id) && !isActive()) {
                        // Skip True Dev Testing Entitlement(s):
                        continue
                    }

                    // Save to Database:
                    const { error } = await supabase.from('entitlements').upsert({
                        id: e?.id,
                        sku_id: e?.sku_id,
                        guild_id: e?.guild_id,
                        starts_at: e?.starts_at,
                        ends_at: e?.ends_at,
                        is_active: isActive(),
                        is_test: isTest(),
                        created_at: e?.['fulfilled_at'] || undefined
                    })

                    if (error) {
                        createLog.error(`FAILED to update an entitlement! - (Id: ${e?.id})`, { entitlement: e, error })
                    }

                }

                // Check for more results:
                if (results?.length == 100) {
                    // Set cursor - Continue Fetching:
                    cursor = results?.at(-1)?.id
                    await new Promise(r => setTimeout(r, 100))
                } else {
                    // Fetching Completed:
                    break
                }

            }

            createLog.info(`Finished Syncing Entitlements to Database! - (Synced Count: ${resultCount})`)
            return true

        } catch (err) {
            // Log Error:
            createLog.error('FAILED to Synchronize Discord Entitlements to Database!', { err })
        }
    }, {
        name: 'entitlements_data_sync',
        timezone: 'America/Chicago'
    })

    if (runImmediately) {
        sch?.execute()
    }

    return 'initialized'
}