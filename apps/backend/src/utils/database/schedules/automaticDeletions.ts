import cron, { ScheduledTask } from 'node-cron'
import core from '../../core/core';
import { APIEntitlement, RESTGetAPIEntitlementsResult, Routes } from 'discord.js';
import { SubscriptionLimits, SubscriptionSKUs } from '@sessionsbot/shared';
import { useLogger } from '../../logs/logtail';
import { supabase } from '../supabase';
import { DateTime } from 'luxon';

const createLog = useLogger();

// Dev Testing Flag:
const debug = true

// Cron Task Instance:
/** @deprecated not currently used */
let autoDataDeletionCron: ScheduledTask = undefined;

/** @Initialize 📂 **Automatic Data Deletion Schedule** 
 * @Performs Automatic data deletions across the database respecting guilds subscription plans and data retention allowances.
 * @Runs Everyday at 10:30 PM
*/
export function initializeDataDeletionSchedule() {
    // Start & Assign Automatic Deletion Cron Schedule:
    cron.schedule('30 22 * * *', async () => {
        try {
            // Debug & Vars:
            if (debug) createLog.for('Schedule').info(`🗑 - Started Automatic Deletion Process - At: ${DateTime.now().setZone('America/Chicago').toFormat('M/d t')}`)
            const { botClient: bot } = core

            // Load All Premium & Enterprise Owner Server IDs:
            const getPaidGuilds = async () => {
                let fetchCursor = undefined;
                let allEntitlements: APIEntitlement[] = []
                const premiumGuilds: string[] = []
                const enterpriseGuilds: string[] = []
                while (true) {
                    const params = new URLSearchParams({
                        sku_ids: `${SubscriptionSKUs.PREMIUM},${SubscriptionSKUs.ENTERPRISE}`,
                        exclude_ended: 'true',
                        limit: '100'
                    });
                    if (fetchCursor) params.set('after', String(fetchCursor))
                    const res: RESTGetAPIEntitlementsResult = await bot.rest.get(Routes.entitlements(bot.application.id), {
                        query: params
                    }) as any;
                    if (!res?.length) break
                    else {
                        allEntitlements.push(...res)
                        if (res.length < 100) break; // last page
                        fetchCursor = res?.at(-1)?.id
                    }
                }
                for (const ent of allEntitlements) {
                    if (!ent.guild_id) continue
                    if (ent.sku_id == SubscriptionSKUs.ENTERPRISE) { enterpriseGuilds.push(ent?.guild_id); continue }
                    if (ent.sku_id == SubscriptionSKUs.PREMIUM && !enterpriseGuilds.includes(ent?.guild_id)) { premiumGuilds.push(ent?.guild_id) }
                }
                return {
                    premium: premiumGuilds,
                    enterprise: enterpriseGuilds
                }
            }
            const paidGuilds = await getPaidGuilds();


            // Delete Expired Sessions:
            const deleteExpiredSessions = async () => {
                // Get Expired Session "Cutoff" Dates:
                const FREE_CUTOFF = DateTime.utc().minus({ days: SubscriptionLimits.FREE.MAX_DATA_RETENTION_AGE.SESSIONS }).toISO()
                const PREMIUM_CUTOFF = DateTime.utc().minus({ days: SubscriptionLimits.PREMIUM.MAX_DATA_RETENTION_AGE.SESSIONS }).toISO()
                const ENTERPRISE_CUTOFF = DateTime.utc().minus({ days: SubscriptionLimits.ENTERPRISE.MAX_DATA_RETENTION_AGE.SESSIONS }).toISO()

                // Delete FREE GUILDS - Expired Sessions:
                const results = await Promise.allSettled([
                    // Free Guilds
                    supabase.from('sessions').delete({ count: 'exact' })
                        .lt('starts_at_utc', FREE_CUTOFF)
                        .notIn('guild_id', [...paidGuilds.premium, ...paidGuilds.enterprise]),
                    // Premium Guilds
                    supabase.from('sessions').delete({ count: 'exact' })
                        .lt('starts_at_utc', PREMIUM_CUTOFF)
                        .in('guild_id', [...paidGuilds.premium]),
                    // Enterprise Guilds:
                    supabase.from('sessions').delete({ count: 'exact' })
                        .lt('starts_at_utc', ENTERPRISE_CUTOFF)
                        .in('guild_id', [...paidGuilds.enterprise])
                ])

                // Parse Results
                const [free, premium, enterprise] = results.map((r, i) => {
                    if (r.status === 'fulfilled') return r.value.count
                    createLog.for('Database').error(`Session auto delete failed for batch ${i}`, { details: r.status === 'rejected' ? r.reason : r })
                    return 'ERROR'
                })

                return { free, premium, enterprise }
            }
            const deletedSessions = await deleteExpiredSessions()


            // Delete Expired Session Templates:
            const deleteExpiredSessionTemplates = async () => {

                // Delete Expired Session Templates:
                const { count, error } = await supabase.from('session_templates').delete({ count: 'exact' })
                    .lte('expires_at_utc', DateTime.utc().toISO())

                // If failure:
                if (error)
                    createLog.for('Schedule').error('Failed to auto delete - Session Templates - See details...', { error })

                return { total_deleted: count }
            }
            const deletedSessionTemplates = await deleteExpiredSessionTemplates()


            // Delete Expired Audit Events:
            const deleteExpiredAuditEvents = async () => {
                // Get Expired Session "Cutoff" Dates:
                const FREE_CUTOFF = DateTime.utc().minus({ days: SubscriptionLimits.FREE.MAX_DATA_RETENTION_AGE.AUDIT_LOG }).toISO()
                const PREMIUM_CUTOFF = DateTime.utc().minus({ days: SubscriptionLimits.PREMIUM.MAX_DATA_RETENTION_AGE.AUDIT_LOG }).toISO()
                const ENTERPRISE_CUTOFF = DateTime.utc().minus({ days: SubscriptionLimits.ENTERPRISE.MAX_DATA_RETENTION_AGE.AUDIT_LOG }).toISO()

                // Delete FREE GUILDS - Expired Sessions:
                const results = await Promise.allSettled([
                    // Free Guilds
                    supabase.from('audit_logs').delete({ count: 'exact' })
                        .lt('created_at', FREE_CUTOFF)
                        .notIn('guild_id', [...paidGuilds.premium, ...paidGuilds.enterprise]),
                    // Premium Guilds
                    supabase.from('audit_logs').delete({ count: 'exact' })
                        .lt('created_at', PREMIUM_CUTOFF)
                        .in('guild_id', [...paidGuilds.premium]),
                    // Enterprise Guilds:
                    supabase.from('audit_logs').delete({ count: 'exact' })
                        .lt('created_at', ENTERPRISE_CUTOFF)
                        .in('guild_id', [...paidGuilds.enterprise])
                ])

                // Parse Results
                const [free, premium, enterprise] = results.map((r, i) => {
                    if (r.status === 'fulfilled') return r.value.count
                    createLog.for('Database').error(`Audit logs auto delete failed for batch ${i}`, { details: r.status === 'rejected' ? r.reason : r })
                    return 'ERROR'
                })

                return { free, premium, enterprise }
            }
            const deletedAuditEvents = await deleteExpiredAuditEvents()

            // Log Results:
            if (debug) {
                createLog.for('Schedule').info(`✅ Automatic Deletion Schedule Succeeded - At: ${DateTime.now().setZone('America/Chicago').toFormat('M/d t')} - See Details...`, {
                    deletion_counts: {
                        sessions: deletedSessions,
                        audit_events: deletedAuditEvents,
                        deletedSessionTemplates
                    }
                })
            }


            // Return Success
            return 'Succeeded - Automatic Data Deletion!'
        } catch (err) {
            // Log & Return Error:
            createLog.for('Schedule').error('AUTO DATA DELETION - ERROR! - See Details...', { error: err })
            return 'Failed - See Logs!'
        }
    }, {
        name: 'auto_data_deletion',
        timezone: 'America/Chicago'
    })

}