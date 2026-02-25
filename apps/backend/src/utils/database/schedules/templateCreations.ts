import { calculateNextPostUTC, mapRsvps, AuditEvent, API_GuildPreferencesDefaults, FullSessionData, Database } from "@sessionsbot/shared";
import { useLogger } from "../../logs/logtail";
import { supabase } from "../supabase"
import { DateTime } from "luxon";
import core from "../../core/core";
import { sendSessionPostFailedFromErrorAlert, sendSessionPostFailedFromPerms } from "../../bot/permissions/failedToSendSessionPanel";
import { buildSessionPanelMsg, buildSessionThreadStartMsg } from "../../bot/messages/sessionPanels";
import { ChannelType, Guild, GuildScheduledEvent, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, Message, MessageFlags, TextChannel, TextThreadChannel, ThreadAutoArchiveDuration } from "discord.js";
import cron, { ScheduledTask } from 'node-cron'
import { createAuditLog } from "../auditLog";
import { getGuildSubscriptionFromId } from "../../bot/entitlements";
import { URLS } from "../../core/urls";
import { processVariableText } from "../../bot/messages/variableText";
import { increaseGuildStat } from "../manager/statsManager";
import { isBotPermissionError } from "../../bot/permissions/permissionsDenied";
import pLimit from "p-limit";

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
        console.info('Sending heartbeat', success)
        const url = success ? heartbeatUrl : `${heartbeatUrl}/fail`;
        await fetch(url, { method: 'POST' });
    } catch (err) {
        createLog.for('Schedule').warn('BetterStack heartbeat failed', { err });
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
            createLog.for('Database').error('Failed to Load Overdue Guilds! - Creation Scheduler - CRITICAL', { details: overdueGuildsErr })
            return
        }
        if (!overdueGuilds?.length) {
            if (debugSchedule) console.info(`[⏰] Template Fetch - Returned 0 results due for next post!`)
            return
        }


        /** Wrapped Fn - Process Guild's Overdue Templates */
        async function processGuild(g: typeof overdueGuilds[number]): Promise<{ success: boolean, details?: unknown }> {
            // Map out overdue templates w bool representing their success:
            const templateCreationSuccess = new Map<string, boolean>()
            let totalSessionsCreated = 0;
            const guildTemplates = g?.session_templates
            if (!guildTemplates) return createLog.for('Schedule').warn('Tried to process guild templates w/ 0 overdue templates?', { guildData: g });
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
                    createLog.for('Schedule').error('Failed to fetch a guild (or subscription) for template creation schedule! - See details...', { details: { dbGuild: g, guildInst: guild, subscription } })
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
                            const failedIds = g?.session_templates?.map(t => t?.id)
                            await escalateTemplateFailure(failedIds)
                            sendTemplateCreationAlert(g?.id, "Guild Channel", failedIds)
                            createLog.for('Schedule').error(`Failed to fetch a guild's post channel for template creation schedule! - See details...`, { details: { channelId, channelTemplates, guildId: g?.id } })
                            return { success: false }
                        }
                        // Confirm Channel is Sendable:
                        if (!channel.isSendable()) {
                            const failedIds = g?.session_templates?.map(t => t?.id)
                            createLog.for('Bot').info(`Missing Perms - Couldn't use post channel! - Template Creation(s)`, { details: { channelId, channelTemplates, guildId: g?.id } });
                            await escalateTemplateFailure(failedIds)
                            sendTemplateCreationAlert(g?.id, 'Permissions', failedIds)
                            return { success: false }
                        }
                        // If this channels templates will thread - Fetch all active once now:
                        if (channelTemplates.some(t => t.post_in_thread)) {
                            await channel.threads.fetch()
                        }

                        // For EACH OVERDUE TEMPLATE:
                        for (const t of channelTemplates) {
                            // Get Vars:
                            const templateRsvps = t.rsvps ? mapRsvps(t.rsvps) : null;
                            const mentionRoles = subscription.limits.ALLOW_MENTION_ROLES ? t.mention_roles : null;
                            /** The **EXACT start date** of this session in UTC time zone */
                            const sessionStart = DateTime.fromISO(t.next_post_utc, { zone: 'utc' }).plus({ millisecond: t.post_before_ms });
                            /** The **BEGINNING of day** of this sessions start time in sessions specified time zone */
                            const dayInZone = sessionStart.setZone(t.time_zone).startOf('day')

                            // Small DELAY:
                            await new Promise(res => setTimeout(res, 350))

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
                                mention_roles: t?.mention_roles,
                                panel_id: 'undefined',
                            }).select('*').single()
                            if (newSessionErr) {
                                // Failed to save new session from template! - Escalate & Return Failure:
                                createLog.for('Bot').error(`Failed to save New Session! - Template Creation(s) - See details...`, { details: { error: newSessionErr, template: t, channelId, guildId: g?.id } });
                                await escalateTemplateFailure([t?.id])
                                sendTemplateCreationAlert(g?.id, 'Session Save', [t?.id])
                                continue // try next session
                            }

                            // Save SESSION RSVP SLOTS from Template (if any):
                            let rsvpSlots: Database['public']['Tables']['session_rsvp_slots']['Row'][] = [];
                            if (templateRsvps?.length > 0) {
                                const { data: newRsvpSlots, error: newRsvpSlotsErr } = await supabase.from('session_rsvp_slots').insert(
                                    templateRsvps.map(data => ({
                                        title: data.name,
                                        emoji: data.emoji,
                                        capacity: data.capacity,
                                        roles_required: data.required_roles,
                                        session_id: newSession?.id,
                                        guild_id: t?.guild_id
                                    }))
                                ).select()
                                if (newRsvpSlotsErr) {
                                    // Failed to save new session from template! - Escalate & Return Failure:
                                    createLog.for('Bot').error(`Failed to save New Session's RSVP Slots! - Template Creation(s) - See details...`, { details: { error: newRsvpSlotsErr, template: t, channelId, guildId: g?.id } });
                                    await escalateTemplateFailure([t?.id])
                                    sendTemplateCreationAlert(g?.id, 'RSVP Save', [t?.id])
                                    // Clean up DB - Delete broken session:
                                    try {
                                        const { error } = await supabase.from('sessions').delete().eq('id', newSession?.id)
                                        if (error) createLog.for('Database').error('FAILED TO REMOVE BROKEN SESSION - From rsvp slot creation error - Deletion issue', { newRsvpSlotsErr, sessionDeletionErr: error, guildId: t?.guild_id })
                                    } catch (e) { }
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
                                        let raw = g?.thread_message_title;
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
                                            let raw = g?.thread_message_description;
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
                                        createLog.for('Schedule').info(`Perms - Failed to get a template's destination thread! - See details...`, { err, channelId, newSession, template: t, guildId: g?.id })
                                        sendTemplateCreationAlert(g?.id, 'Permissions', [t.id])
                                    } else {
                                        createLog.for('Schedule').error(`Failed to get a template's destination thread! - See details...`, { err, channelId, newSession, template: t, guildId: g?.id })
                                        sendTemplateCreationAlert(g?.id, 'Destination Channel', [t.id])
                                    }
                                    await escalateTemplateFailure([t.id])
                                    // Clean up DB session + rsvps
                                    await Promise.allSettled([
                                        supabase.from('session_rsvp_slots').delete().eq('session_id', newSession?.id),
                                        supabase.from('sessions').delete().eq('id', newSession?.id)
                                    ]).catch(err => {
                                        createLog.for('Database').error('FAILED TO REMOVE BROKEN SESSION/RSVPs - From destination thread creation error', { error: err, guildId: t?.guild_id })
                                    })
                                    continue // try next template 
                                }


                            } else {
                                // Posting to Channel - Assign as Destination:
                                destinationChannel = channel;
                            }

                            // Build Session's Panel's Content:
                            const panelContent = await buildSessionPanelMsg(
                                {
                                    ...newSession,
                                    session_rsvp_slots: rsvpSlots.map(s => {
                                        return { ...s, session_rsvps: <any>[] }
                                    })
                                },
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
                                    createLog.for('Schedule').info('Perms - Failed to send session panel message! - No access!', { guildId: g?.id, channelId, session: newSession, error: err });
                                    sendTemplateCreationAlert(g?.id, 'Permissions', [t.id])
                                } else {
                                    createLog.for('Schedule').error('Failed to send session panel message! - See details..', { guildId: g?.id, channelId, session: newSession, error: err });
                                    sendTemplateCreationAlert(g?.id, 'Session Panel', [t.id])
                                }
                                // Escalate Failure:
                                await escalateTemplateFailure([t.id])
                                // Clean up DB session + rsvps
                                await Promise.allSettled([
                                    supabase.from('session_rsvp_slots').delete().eq('session_id', newSession?.id),
                                    supabase.from('sessions').delete().eq('id', newSession?.id)
                                ])
                                continue // try next template
                            }


                            // Native Discord Event - Create if Enabled:
                            let nativeEvent: GuildScheduledEvent | null = null;
                            if (t.native_events) {
                                // Events Enabled - Create
                                try {
                                    // Get Event Safe Dates:
                                    const baseStart = sessionStart > DateTime.utc()
                                        ? sessionStart
                                        : DateTime.utc().plus({ hour: 1 }).startOf("hour");
                                    const localStart = baseStart.setZone(t.time_zone);
                                    const eventStart = baseStart
                                        .setZone(t.time_zone)
                                        .toJSDate();
                                    const eventEnd = t.duration_ms
                                        ? baseStart
                                            .plus({ milliseconds: t.duration_ms })
                                            .setZone(t.time_zone)
                                            .toJSDate()
                                        : baseStart
                                            .plus({ hour: 1 })
                                            .setZone(t.time_zone)
                                            .toJSDate();
                                    const eventDescription = () => {
                                        const raw = t?.description?.trim();
                                        const hasContent = raw && raw.length > 1;
                                        const showWatermark = subscription.limits.SHOW_WATERMARK;
                                        const watermark = `${core.emojis.string('logo')} Powered by Sessions Bot | [Learn More](${URLS.website})`;
                                        if (!hasContent && !showWatermark) return null;
                                        if (!hasContent && showWatermark) return watermark;
                                        if (hasContent && !showWatermark) return raw;
                                        return `${raw}\n${watermark}`;
                                    }
                                    // Create Discord Native Event:
                                    nativeEvent = await guild.scheduledEvents.create({
                                        name: t.title,
                                        description: eventDescription(),
                                        scheduledStartTime: eventStart,
                                        scheduledEndTime: eventEnd,
                                        entityType: GuildScheduledEventEntityType.External,
                                        privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                                        entityMetadata: { location: t?.url ? t.url : panelMsg?.url },
                                    })
                                } catch (err) {
                                    // Discord Event Creation Error:
                                    createLog.for('Bot').error('Failed to create a NATIVE EVENT for a session! - See Details..', { guildId: g?.id, session: newSession, error: err })
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
                                    createLog.for('Database').error('FAILED TO UPDATE - Session on creation - Applying "true id(s)"', { updateSessionErr, newSession, guildId: g?.id })
                                    sendTemplateCreationAlert(g?.id, 'Update Session', [t.id])
                                    await escalateTemplateFailure([t.id])
                                    // Clean up DB Session + RSVPs:
                                    await Promise.allSettled([
                                        supabase.from('session_rsvp_slots').delete().eq('session_id', newSession?.id),
                                        supabase.from('sessions').delete().eq('id', newSession?.id)
                                    ])
                                    // If Discord Event Created - Delete:
                                    if (nativeEvent) {
                                        try { await nativeEvent.delete(); } catch { }
                                    }
                                    // Continue to next template:
                                    continue;
                                }
                            }


                            // Update Session Template - Next/Last Post UTC:
                            const newNextPostUTC = calculateNextPostUTC({
                                startDate: DateTime.fromISO(t.starts_at_utc),
                                zone: t.time_zone,
                                postOffsetMs: t.post_before_ms,
                                rrule: t.rrule,
                                referenceDate: DateTime.fromISO(t.next_post_utc),
                            });
                            const { error: updateTemplateErr } = await supabase
                                .from('session_templates')
                                .update({
                                    failure_count: 0,
                                    last_fail_at: null,
                                    enabled: true,
                                    next_post_utc: newNextPostUTC?.toISO() || null,
                                    last_post_utc: DateTime.now()?.toUTC()?.toISO()
                                })
                                .eq('id', t.id)
                            if (updateTemplateErr) {
                                createLog.for('Database').error('FAILED TO UPDATE - Template Next/Last Post UTC(s) - See Details..', { error: updateTemplateErr, template: t, session: newSession })
                                // Retry Updates:
                                const retry = await supabase
                                    .from('session_templates')
                                    .update({
                                        failure_count: 0,
                                        last_fail_at: null,
                                        enabled: true,
                                        next_post_utc: newNextPostUTC?.toISO() || null,
                                        last_post_utc: DateTime.now().toUTC().toISO()
                                    })
                                    .eq('id', t.id)
                                if (retry.error) {
                                    // Delete Broken Session Data:
                                    // FAILED - Updating Template - Delete Invalid Database Results - Alert:
                                    createLog.for('Database').error('FAILED TO UPDATE - Template on session creation - Applying "true dates"', { updateTemplateErr, template: t, session: newSession })
                                    // Alert & Escalate Failure:
                                    sendTemplateCreationAlert(g?.id, 'Update Template', [t.id])
                                    await escalateTemplateFailure([t.id])
                                    // Clean up DB Session + RSVPs:
                                    await Promise.allSettled([
                                        supabase.from('session_rsvp_slots').delete().eq('session_id', newSession?.id),
                                        supabase.from('sessions').delete().eq('id', newSession?.id)
                                    ])
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
                        const failedIds = g?.session_templates?.map(t => t?.id).filter(i => !succeededChannelTemplates.includes(i))
                        if (isBotPermissionError(error)) {
                            sendTemplateCreationAlert(g?.id, "Permissions", failedIds)
                            createLog.for('Schedule').info(`Perms Missing - Failed to process guild's post channel for template creation schedule! - See details...`, { details: { channelId, channelTemplates, guildId: g?.id } })
                        } else {
                            sendTemplateCreationAlert(g?.id, "Guild Channel", failedIds)
                            createLog.for('Schedule').error(`Failed to process guild's post channel for template creation schedule! - See details...`, { details: { channelId, channelTemplates, guildId: g?.id } })
                        }
                        await escalateTemplateFailure(failedIds)
                        return { success: false }
                    }
                }


                // Allow 3 Consecutive Channel Posting Processes PER GUILD:
                const postLimit = pLimit(3)
                await Promise.all(
                    [...postChannels.entries()].map(([id, templates]) =>
                        postLimit(() => processPostChannel(id, templates))
                    )
                )

                // Increase Guild Stats:
                await increaseGuildStat(g?.id, "sessions_created", totalSessionsCreated)

                // Debug:
                if (debugSchedule) console.info(`[✅] Finished Guild's Template(s) - ${g?.id}(${guild?.name}) ${DateTime.now().toFormat('F')}`)

            } catch (error) {
                // Failed to process overdue guild's templates - Log & Return:
                createLog.for('Schedule').error(`Failed to process a guild's overdue templates! - See details..`, { guildId: g?.id, guildData: g, error })
                return { success: false }
            }
        }

        // Process UP TO 5 Guilds Overdue Templates at a time:
        const guildLimit = pLimit(5)
        await Promise.all(
            overdueGuilds.map(g => guildLimit(() => processGuild(g)))
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
        createLog.for('Schedule').error('EXECUTION FAILED! - CRITICAL - See Details..', { details: execution })
        sendHeartbeat(false)
    })

    if (opts?.runOnExecution) {
        if (debugSchedule) console.info(`[⏰] Running Session Template Creation Schedule Early..`)
        sessionTemplateCreationCron.execute()
    }
}