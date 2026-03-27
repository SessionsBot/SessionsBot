import { processVariableText, mapRsvps, AuditEvent, API_GuildPreferencesDefaults, Database, getSchedulesNextPostUTC } from "@sessionsbot/shared";
import { useLogger } from "../logs/logtail";
import { supabase } from "../database/supabase"
import { DateTime } from "luxon";
import core from "../core/core";
import { sendSessionPostFailedFromErrorAlert, sendSessionPostFailedFromPerms } from "../bot/permissions/failedToSendSessionPanel";
import { buildSessionPanelMsg, buildSessionThreadStartMsg } from "../bot/messages/sessionPanels";
import { ChannelType, DiscordAPIError, Guild, GuildScheduledEvent, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, Message, MessageFlags, TextChannel, TextThreadChannel, ThreadAutoArchiveDuration } from "discord.js";
import cron, { ScheduledTask } from 'node-cron'
import { createAuditLog } from "../database/auditLog";
import { getGuildSubscriptionFromId } from "../bot/entitlements";
import { URLS } from "../core/urls";
import { increaseGuildStat } from "../database/manager/statsManager";
import { isBotPermissionError, sendPermissionAlert } from "../bot/permissions/permissionsDenied";
import pLimit from "p-limit";
import { createNativeEventForSession } from "../bot/nativeEvents";

const createLog = useLogger();
const debugSchedule = true;

/** The `ScheduledTask` obj of the Session Template creation schedule */
let sessionTemplateCreationCron: ScheduledTask = null;


export type SessionPostFailureReason = 'Guild Fetch' | 'Guild Channel' | 'Destination Channel' | 'Session Save' | 'RSVP Save' | 'Session Panel' | 'Update Session' | 'Update Template' | 'Permissions' | 'Unknown'
/** Util: Send a Template Creation Failure Alert a Server */
async function sendTemplateCreationAlert(guildId: string, reason: SessionPostFailureReason, templateIds: string[]) {
    if (reason == 'Permissions')
        return sendSessionPostFailedFromPerms(guildId, templateIds)
    else return sendSessionPostFailedFromErrorAlert(guildId, reason, templateIds)
}

/** Util: Template Creation Failure Escalation Function
 * @prevents infinite retries */
async function escalateTemplateFailure(templateIds: string[]) {
    // Use Database Function to Increment Template Failures by Ids:
    const { error } = await supabase.rpc('increment_template_failures', {
        template_ids: templateIds
    })
    if (error) {
        createLog.for('Database').error('CRITICAL - FAILED TO ESCALATE TEMPLATE FAILURE(s)!', { templateIds, error })
    }
}

/** Util: Send BetterStack Heartbeat Record by URL */
async function sendHeartbeat(success: boolean) {
    const heartbeatUrl = process?.env?.['BETTERSTACK_TEMPLATE_CREATION_HEARTBEAT_URL']
    if (!heartbeatUrl) return;
    try {
        const url = success ? heartbeatUrl : `${heartbeatUrl}/fail`;
        await fetch(url, { method: 'POST' });
    } catch (err) {
        createLog.for('Api').warn('Template/Schedule Creation(s) - Heartbeat Send FAILED!', { err });
    }
}


/** Session Template Creation Schedule - **Execution** - Scans templates that are overdue for post -> posts them!*/
async function executeTemplateCreationSchedule() {
    try {
        if (debugSchedule) console.info(`[⏰] Template Creation Schedule - Executing at ${DateTime.now().toFormat('F')}`)

        // Fetch Guilds w/ Overdue Templates from DB:
        const { data: overdueGuilds, error: overdueGuildsErr } = await supabase.from('guilds')
            .select('id, accent_color, calendar_button, thread_message_title, thread_message_description, session_templates!inner(*)')
            .eq('session_templates.enabled', true)
            .lte('session_templates.next_post_utc', DateTime.utc().toISO())
            .order('starts_at_utc', {
                referencedTable: 'session_templates',
                ascending: true
            })
        // Confirm Data Fetched:
        if (overdueGuildsErr) {
            createLog.for('Database').error('Failed to Load Overdue Guilds! - Schedule Creation Scheduler - CRITICAL', { err: overdueGuildsErr })
            return sendHeartbeat(false)
        }
        if (!overdueGuilds?.length) {
            if (debugSchedule) console.info(`[⏰] Template Fetch - Returned 0 results due for next post!`)
            return sendHeartbeat(true)
        }


        /** Wrapped Fn - Process Guild's Overdue Templates */
        async function processGuild(g: typeof overdueGuilds[number]): Promise<{ success: boolean, details?: unknown }> {
            // Map out overdue templates w bool representing their success:
            const templateCreationSuccess = new Map<string, boolean>()
            let totalSessionsCreated = 0;
            const guildTemplates = g?.session_templates
            if (!guildTemplates) return createLog.for('Schedule').warn('Tried to process guild templates w/ 0 overdue templates?', { guildData: g, guildId: g?.id });
            for (const t of guildTemplates) { templateCreationSuccess.set(t?.id, false) }
            // Attempt creation(s):
            try {
                // Fetch Guild Instance & Subscription:
                const [guild, subscription] = await Promise.all([
                    core.botClient.guilds.fetch(g?.id),
                    getGuildSubscriptionFromId(g?.id)
                ])
                // Confirm Fetched:
                if (!guild || !subscription) {
                    // Failed to Fetch - Alert & Escalate Failure:
                    const failedIds = g?.session_templates?.map(t => t?.id)
                    await escalateTemplateFailure(failedIds)
                    sendTemplateCreationAlert(g?.id, "Guild Fetch", failedIds)
                    createLog.for('Schedule').error('Failed to fetch a guild (or subscription) for template creation schedule! - See details...', { details: { dbGuild: g, guildInst: guild?.available, subscription }, guildId: g?.id })
                    return { success: false }
                }
                // Map Overdue Templates -> Post Channels:
                const postChannels = new Map<string, typeof guildTemplates>()
                for (const t of guildTemplates) {
                    const channelId = t?.channel_id
                    if (!postChannels.has(channelId)) {
                        postChannels.set(channelId, [])
                    }
                    postChannels.get(channelId).push(t)
                }

                // Debug:
                if (debugSchedule) console.info(`[📩] Processing Guild's Overdue Template(s) - ${g?.id}(${guild?.name}) ${DateTime.now().toFormat('F')}`)

                // Process EACH Post Channel:
                async function processPostChannel(channelId: string, channelTemplates: typeof guildTemplates): Promise<{ success: boolean, details?: unknown }> {
                    let succeededChannelTemplates: string[] = [];
                    try {
                        // Fetch Post Channel:
                        const channel = await guild.channels.fetch(channelId) as TextChannel | undefined;
                        // Confirm Channel:
                        if (!channel) {
                            // Failed to Fetch Post Channel - Alert & Escalate Failure:
                            const failedIds = channelTemplates?.map(t => t?.id)
                            await escalateTemplateFailure(failedIds)
                            sendTemplateCreationAlert(g?.id, "Guild Channel", failedIds)
                            createLog.for('Schedule').error(`Failed to fetch a guild's post channel for template creation schedule!`, { channelId, channelTemplates, guildId: g?.id })
                            return { success: false }
                        }
                        // Confirm Channel is Sendable:
                        if (!channel.isSendable()) {
                            const failedIds = channelTemplates?.map(t => t?.id)
                            createLog.for('Bot').info(`Missing Perms - Couldn't use post channel (un-sendable)! - Template Creation(s) Schedule`, { channelId, channelTemplates, guildId: g?.id });
                            await escalateTemplateFailure(failedIds)
                            sendTemplateCreationAlert(g?.id, 'Permissions', failedIds)
                            return { success: false }
                        }
                        // If this channels templates will thread - Fetch all active once now:
                        if (channelTemplates.some(t => t.post_in_thread)) {
                            await channel.threads.fetchActive()
                        }

                        // Small DELAY Per Channel:
                        await new Promise(res => setTimeout(res, 125))

                        // For EACH OVERDUE TEMPLATE:
                        for (const t of channelTemplates) {
                            // Get Vars:
                            const templateRsvps = t.rsvps ? mapRsvps(t.rsvps) : null;
                            const mentionRoles = subscription.limits.ALLOW_MENTION_ROLES ? t.mention_roles : null;
                            /** The **EXACT start date** of this session in UTC time zone */
                            const sessionStart = DateTime.fromISO(t.next_post_utc, { zone: 'utc' }).plus({ millisecond: t.post_before_ms });
                            /** The **BEGINNING of day** of this sessions start time in sessions specified time zone */
                            const dayInZone = sessionStart.setZone(t.time_zone).startOf('day')

                            // Save NEW SESSION from Template:
                            const { data: newSession, error: newSessionErr } = await supabase.from('sessions').insert({
                                title: t?.title,
                                description: t?.description,
                                url: t?.url,
                                starts_at_utc: sessionStart?.toISO(),
                                duration_ms: t?.duration_ms,
                                time_zone: t?.time_zone,
                                guild_id: t?.guild_id,
                                channel_id: t?.channel_id,
                                template_id: t?.id,
                                mention_roles: mentionRoles,
                                panel_id: 'awaiting_update',
                                status: 'scheduled'
                            }).select('*').single()
                            if (newSessionErr) {
                                // Failed to save new session from template! - Escalate & Return Failure:
                                createLog.for('Bot').error(`Failed to save New Session! - Template Creation(s) Schedule - See details...`, { error: newSessionErr, template: t, channelId, guildId: g?.id });
                                await escalateTemplateFailure([t?.id])
                                sendTemplateCreationAlert(g?.id, 'Session Save', [t?.id])
                                continue // try next session
                            }

                            // Save SESSION RSVP SLOTS from Template (if any):
                            let rsvpSlots: Database['public']['Tables']['session_rsvp_slots']['Row'][] = [];
                            if (templateRsvps?.length > 0) {
                                const { data: newRsvpSlots, error: newRsvpSlotsErr } = await supabase.from('session_rsvp_slots').insert(
                                    templateRsvps.map(data => ({
                                        title: data?.name,
                                        emoji: data?.emoji ?? null,
                                        capacity: data?.capacity,
                                        roles_required: data?.required_roles ?? [],
                                        session_id: newSession?.id,
                                        guild_id: t?.guild_id
                                    }))
                                ).select()
                                if (newRsvpSlotsErr) {
                                    // Failed to save new session from template! - Escalate & Return Failure:
                                    createLog.for('Bot').error(`Failed to save New Session's RSVP Slots! - Template Creation(s) - See details...`, { error: newRsvpSlotsErr, template: t, channelId, guildId: g?.id });
                                    await escalateTemplateFailure([t?.id])
                                    sendTemplateCreationAlert(g?.id, 'RSVP Save', [t?.id])
                                    // Clean up DB - Delete broken session:
                                    try {
                                        const { error } = await supabase.from('sessions').delete().eq('id', newSession?.id)
                                        if (error) throw error;
                                    } catch (e) { createLog.for('Database').error('FAILED TO REMOVE BROKEN SESSION - From rsvp slot creation error - Deletion issue', { newRsvpSlotsErr, sessionDeletionErr: e, guildId: t?.guild_id }) }
                                    continue // try next template
                                } else { rsvpSlots = newRsvpSlots }
                            }


                            // Get Panel Destination - Channel or Daily Thread:
                            let destinationChannel: TextThreadChannel | TextChannel = null;
                            if (t.post_in_thread) {
                                // Posting Session to Thread:
                                try {
                                    // Compute Thread Title - Preferences:
                                    const getThreadTitle = () => {
                                        let raw = subscription?.limits?.CUSTOM_THREAD_START_MESSAGE ? g?.thread_message_title : null;
                                        if (!raw || raw == 'DEFAULT') raw = API_GuildPreferencesDefaults.thread_message_title;
                                        return processVariableText(raw, { displayDate: dayInZone })
                                    }
                                    const threadTitle = getThreadTitle();
                                    // Search for existing thread:
                                    const threads = channel.threads.cache
                                    const existingThread = threads.find(t => t.name == threadTitle && t.ownerId == core.botClient.user.id)
                                    if (existingThread) {
                                        // Existing Thread - Assign:
                                        destinationChannel = existingThread;
                                    } else {
                                        // CREATING THREAD - Send "Thread Start" Message - Compute Thread Desc:
                                        const getThreadDescription = () => {
                                            let raw = subscription?.limits?.CUSTOM_THREAD_START_MESSAGE ? g?.thread_message_description : null;
                                            if (!raw || raw == 'DEFAULT') raw = API_GuildPreferencesDefaults.thread_message_description;
                                            return processVariableText(raw, { displayDate: dayInZone })
                                        }
                                        const threadDescription = getThreadDescription();
                                        const threadStartMsg = await channel.send({
                                            components: [
                                                buildSessionThreadStartMsg(threadTitle, threadDescription, g?.accent_color, subscription.limits.SHOW_WATERMARK)
                                            ],
                                            flags: MessageFlags.IsComponentsV2
                                        })
                                        // Create NEW Thread for Day - Assign as Destination:
                                        const thread = await channel.threads.create({
                                            name: threadTitle,
                                            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                                            startMessage: threadStartMsg,
                                            type: ChannelType.PublicThread
                                        })
                                        destinationChannel = thread;
                                    }
                                } catch (err) {
                                    // Failed to get Panel Destination Channel (thread/channel) - Log & Escalate Failure:
                                    if (isBotPermissionError(err)) {
                                        createLog.for('Permissions').info(`Failed to get/create a template's destination thread! - Skipping Template`, { err, channelId, newSession, template: t, guildId: g?.id })
                                        sendTemplateCreationAlert(g?.id, 'Permissions', [t.id])
                                    } else {
                                        createLog.for('Schedule').error(`Failed to get/create a template's destination thread! - See Details...`, { err, channelId, newSession, template: t, guildId: g?.id })
                                        sendTemplateCreationAlert(g?.id, 'Destination Channel', [t.id])
                                    }
                                    await escalateTemplateFailure([t.id])
                                    // Clean up DB session + rsvps
                                    const cleanup = await Promise.all([
                                        supabase.from('session_rsvp_slots').delete().eq('session_id', newSession?.id),
                                        supabase.from('sessions').delete().eq('id', newSession?.id)
                                    ])
                                    if (cleanup.some(s => s.error != null)) {
                                        createLog.for('Database').error('FAILED TO REMOVE BROKEN SESSION/RSVPs - From destination thread get/creation error', { guildId: t?.guild_id, cleanupResults: cleanup })
                                    }

                                    continue // try next template 
                                }


                            } else {
                                // Posting to Channel - Assign as Destination:
                                destinationChannel = channel;
                            }

                            // Build Session's Panel's Content:
                            const fullSessionData = {
                                ...newSession,
                                session_rsvp_slots: rsvpSlots.map(s => {
                                    return { ...s, session_rsvps: <any>[] }
                                })
                            }
                            const panelContent = await buildSessionPanelMsg(
                                fullSessionData,
                                subscription.limits.SHOW_WATERMARK,
                                g?.accent_color,
                                g?.calendar_button
                            )

                            // Send Session's Panel Message:
                            let panelMsg: Message
                            try {
                                panelMsg = await destinationChannel.send({
                                    components: [panelContent],
                                    flags: MessageFlags.IsComponentsV2
                                })
                            } catch (err) {
                                // Failed to Send Sessions Panel - Check & Alert Error:
                                if (isBotPermissionError(err)) {
                                    createLog.for('Permissions').info('Failed to send session panel message! - No access!', { guildId: g?.id, channelId, session: newSession, error: err });
                                    sendTemplateCreationAlert(g?.id, 'Permissions', [t.id])
                                } else {
                                    createLog.for('Schedule').error('Failed to send session panel message! - See details..', { guildId: g?.id, channelId, session: newSession, error: err });
                                    sendTemplateCreationAlert(g?.id, 'Session Panel', [t.id])
                                }
                                // Escalate Failure:
                                await escalateTemplateFailure([t.id])
                                // Clean up DB session + rsvps
                                const cleanup = await Promise.all([
                                    supabase.from('session_rsvp_slots').delete().eq('session_id', newSession?.id),
                                    supabase.from('sessions').delete().eq('id', newSession?.id)
                                ])
                                if (cleanup.some(s => s.error != null)) {
                                    createLog.for('Database').error('FAILED TO REMOVE BROKEN SESSION/RSVPs - From FAILED session panel post!', { guildId: t?.guild_id, cleanupResults: cleanup })
                                }
                                continue // try next template
                            }


                            // Native Discord Event - Create if Enabled:
                            let nativeEvent: GuildScheduledEvent | null = null;
                            if (t?.native_events) {
                                // Events Enabled - Create
                                const result = await createNativeEventForSession({
                                    session: fullSessionData,
                                    panelMsgUrl: panelMsg?.url,
                                    startDate: sessionStart,
                                    showWatermark: subscription?.limits?.SHOW_WATERMARK
                                })
                                if (result?.success && result?.event) {
                                    nativeEvent = result?.event
                                }
                            }


                            // Update New Session with ACCURATE DISCORD IDs:
                            const { error: updateSessionErr } = await supabase.from('sessions').update({
                                thread_id: t?.post_in_thread ? destinationChannel?.id : null,
                                event_id: t?.native_events ? nativeEvent?.id : null,
                                panel_id: panelMsg?.id,
                            }).eq('id', newSession?.id)
                            // If Session Update Failed - Retry:
                            if (updateSessionErr) {
                                const retry = await supabase.from('sessions').update({
                                    thread_id: t?.post_in_thread ? destinationChannel?.id : null,
                                    event_id: t?.native_events ? nativeEvent?.id : null,
                                    panel_id: panelMsg?.id,
                                }).eq('id', newSession?.id)
                                if (retry.error) {
                                    // Fully Failed - Session Update - Log & Escalate:
                                    createLog.for('Database').error('FAILED TO UPDATE - Session on creation - Applying "true id(s)"', { retryError: retry.error, newSession, guildId: g?.id })
                                    sendTemplateCreationAlert(g?.id, 'Update Session', [t.id])
                                    await escalateTemplateFailure([t.id])
                                    // Clean up DB Session + RSVPs:
                                    const cleanup = await Promise.all([
                                        supabase.from('session_rsvp_slots').delete().eq('session_id', newSession?.id),
                                        supabase.from('sessions').delete().eq('id', newSession?.id)
                                    ])
                                    if (cleanup.some(s => s.error != null)) {
                                        createLog.for('Database').error('FAILED TO REMOVE BROKEN SESSION/RSVPs - From failed session update after post!', { guildId: t?.guild_id, cleanupResults: cleanup })
                                    }
                                    // Delete Session Panel - Already Posted:
                                    if (panelMsg.deletable) {
                                        try { await panelMsg?.delete() } catch { }
                                    } else createLog.for('Bot').warn('Failed to DELETE a broken session panel - Session Update Err!', { err: retry.error, guildId: t?.guild_id, })
                                    // If Discord Event Created - Delete:
                                    if (nativeEvent) {
                                        try { await nativeEvent.delete(); } catch { }
                                    }
                                    // Continue to next template:
                                    continue;
                                }
                            }


                            // Get Templates Next Post Date:
                            const newNextPostUTC = getSchedulesNextPostUTC({
                                startsAtUtc: DateTime?.fromISO(t.starts_at_utc, { zone: 'utc' }),
                                postOffsetMs: t.post_before_ms,
                                RRule: t.rrule,
                                afterDate: DateTime.utc()
                            });
                            // Update Session Template - Next/Last Post UTC:
                            const { error: updateTemplateErr } = await supabase
                                .from('session_templates')
                                .update({
                                    failure_count: 0,
                                    enabled: true,
                                    next_post_utc: newNextPostUTC?.toISO() || null,
                                    last_post_utc: DateTime.now()?.toUTC()?.toISO()
                                })
                                .eq('id', t.id)
                            if (updateTemplateErr) {
                                createLog.for('Database').error('FAILED TO UPDATE - Template Next/Last Post UTC(s) - See Details..', { error: updateTemplateErr, guildId: g?.id, template: t, session: newSession })
                                // Retry Updates:
                                const retry = await supabase
                                    .from('session_templates')
                                    .update({
                                        failure_count: 0,
                                        enabled: true,
                                        next_post_utc: newNextPostUTC?.toISO() || null,
                                        last_post_utc: DateTime.now().toUTC().toISO()
                                    })
                                    .eq('id', t.id)
                                if (retry.error) {
                                    // Delete Broken Session Data:
                                    // FAILED - Updating Template - Delete Invalid Database Results - Alert:
                                    createLog.for('Database').error('FAILED TO UPDATE - Template on session creation - Applying "true dates"', { retryError: retry.error, guildId: g?.id, template: t, session: newSession })
                                    // Alert & Escalate Failure:
                                    sendTemplateCreationAlert(g?.id, 'Update Template', [t.id])
                                    await escalateTemplateFailure([t.id])
                                    // Clean up DB Session + RSVPs:
                                    const cleanup = await Promise.all([
                                        supabase.from('session_rsvp_slots').delete().eq('session_id', newSession?.id),
                                        supabase.from('sessions').delete().eq('id', newSession?.id)
                                    ])
                                    if (cleanup.some(s => s.error != null)) {
                                        createLog.for('Database').error('FAILED TO REMOVE BROKEN SESSION/RSVPs - From failed template update after session update/post!', { guildId: t?.guild_id, cleanupResults: cleanup })
                                    }
                                    // Delete Session Panel - Already Posted:
                                    if (panelMsg.deletable) {
                                        try { await panelMsg?.delete() } catch { }
                                    } else createLog.for('Bot').warn('Failed to DELETE a broken session panel - Template Update Err!', { err: retry.error, guildId: t?.guild_id })
                                    // If Discord Event Created - Delete:
                                    if (nativeEvent) {
                                        try { await nativeEvent.delete(); } catch { }
                                    }
                                    // Continue to next template:
                                    continue;
                                }
                            }

                            // Session Created & Posted - Create Audit Event:
                            createAuditLog({
                                event: AuditEvent.SessionPosted,
                                guild: g?.id,
                                user: core.botClient?.user?.id || null,
                                meta: { session_id: newSession?.id }
                            })
                            // Increase Stat Counter:
                            totalSessionsCreated++;

                            // Mark template as succeeded:
                            succeededChannelTemplates.push(t?.id)
                            templateCreationSuccess.set(t?.id, true)

                            // Debug:
                            if (debugSchedule) console.info(`[📃] Posted New Session - ${newSession?.title} - ${g?.id}(${guild?.name}) - ${DateTime.now().toFormat('F')}`)

                        }


                    } catch (error) {
                        // Failed to Process Guild Post Channel - Alert & Escalate Failure:
                        const failedIds = channelTemplates?.map(t => t?.id).filter(i => !succeededChannelTemplates.includes(i))
                        if (isBotPermissionError(error)) {
                            sendTemplateCreationAlert(g?.id, "Permissions", failedIds)
                            createLog.for('Permissions').info(`Failed to process guild's post channel for template creation schedule! - See details!`, { channelId, error, channelTemplates, guildId: g?.id })
                        } else {
                            sendTemplateCreationAlert(g?.id, "Guild Channel", failedIds)
                            createLog.for('Schedule').error(`Failed to process guild's post channel for template creation schedule! - See details!`, { channelId, error, channelTemplates, guildId: g?.id })
                        }
                        await escalateTemplateFailure(failedIds)
                        return { success: false }
                    }
                }


                // Allow 3 Consecutive Channel Posting Processes PER GUILD:
                const postLimit = pLimit(3)
                await Promise.all(
                    [...postChannels.entries()].map(([id, templates]) =>
                        postLimit(async () => await processPostChannel(id, templates))
                    )
                )

                // Increase Guild Stats:
                await increaseGuildStat(g?.id, "sessions_created", totalSessionsCreated)

                // Debug:
                if (debugSchedule) console.info(`[✅] Finished Guild's Template(s) - ${g?.id}(${guild?.name}) ${DateTime.now().toFormat('F')}`)

            } catch (error) {
                // Failed to process overdue guild's templates - Log & Return:
                createLog.for('Schedule').error(`Failed to process a guild's overdue templates! - CRITICAL!`, { guildId: g?.id, guildData: g, error })
                return { success: false }
            }
        }

        // Process UP TO 5 Guilds Overdue Templates at a time:
        const guildLimit = pLimit(5)
        await Promise.all(
            overdueGuilds.map(g => guildLimit(async () => await processGuild(g)))
        )

        if (debugSchedule) console.info(`[✅] Template Creation Schedule - Completed at ${DateTime.now().toFormat('F')}`)

        // Successful Cron/Schedule Run - Report to Heartbeat:
        await sendHeartbeat(true)

    } catch (error) {
        // Template Creation Schedule - Cron Root - Errored:
        createLog.for('Schedule').error('CRITICAL! - Template Creation Scheduler - ROOT Errored', { error })
        // Send Failure to Heartbeat:
        await sendHeartbeat(false)
    }
}


/** Initializes the session template creation schedule.
 * @runs every 5 mins of each hour */
export async function initializeTemplateCreationScheduler(opts?: { runOnExecution?: boolean }) {
    if (debugSchedule) console.info(`[⏰] Initializing Template Creation Scheduler! - At: ${DateTime.now().toFormat('F')}`)
    sessionTemplateCreationCron = cron.schedule(`*/5 * * * *`, executeTemplateCreationSchedule, {
        timezone: 'UTC',
        name: 'template_creation',
        noOverlap: true
    })

    // Catch - Execution Errors:
    sessionTemplateCreationCron.on("execution:failed", (ctx) => {
        const { execution } = ctx;
        createLog.for('Schedule').error('EXECUTION FAILED! - CRITICAL - See Details!', { details: execution })
        sendHeartbeat(false)
    })

    if (opts?.runOnExecution) {
        if (debugSchedule) console.info(`[⏰] Running Session Template Creation Schedule Early..`)
        sessionTemplateCreationCron.execute()
    }
}