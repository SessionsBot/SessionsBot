import { calculateNextPostUTC, mapRsvps, AuditEvent, API_GuildPreferencesDefaults } from "@sessionsbot/shared";
import { useLogger } from "../../logs/logtail";
import { supabase } from "../supabase"
import { DateTime } from "luxon";
import core from "../../core/core";
import { sendSessionPostFailedFromErrorAlert, sendSessionPostFailedFromPerms } from "../../bot/permissions/failedToSendMsg";
import { buildSessionPanelMsg, buildSessionThreadStartMsg } from "../../bot/messages/sessionSignup";
import { ChannelType, Guild, GuildScheduledEvent, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, Message, MessageFlags, TextChannel, TextThreadChannel, ThreadAutoArchiveDuration } from "discord.js";
import cron, { ScheduledTask } from 'node-cron'
import { createAuditLog } from "../auditLog";
import { getGuildSubscriptionFromId } from "../../bot/entitlements";
import { URLS } from "../../core/urls";
import { processVariableText } from "../../bot/messages/variableText";
import { increaseGuildStat } from "../manager/statsManager";
import { isBotPermissionError } from "../../bot/permissions/permissionsDenied";

const heartbeatUrl = process?.env?.['BETTERSTACK_TEMPLATE_CREATION_HEARTBEAT_URL']

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

/** Util: Template Creation Failure Escalation Function */
async function logTemplateFailure(templateIds: string[]) {
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

        // Fetch/load Session Templates -> PAST NOW 'next_post_utc':
        const getTemplates = async (fromUTC: DateTime) => {
            // Fetch Templates:
            const { data, error } = await supabase
                .from('session_templates')
                .select('*')
                .eq('enabled', true)
                .lte('next_post_utc', fromUTC.toISO())

            // Catch Fetch Errors:
            if (error) {
                createLog.for('Database').error('Failed to load templates! - Creation Scheduler - CRITICAL', { details: error });
                return null;
            }
            // No Results Returned:
            if (!data || !data?.length) {
                if (debugSchedule) console.info(`[⏰] Template Fetch - Returned 0 results due for next post!`)
                return null;
            }
            // Return Templates:
            return data;
        }
        const templateFetch = await getTemplates(DateTime.now().toUTC());
        if (!templateFetch || !templateFetch.length) return await sendHeartbeat(true);

        // Map Overdue Templates into "Post" Queue:
        let postQueue: { [guildId: string]: { [channelId: string]: typeof templateFetch } } = {};
        for (const t of templateFetch) {
            postQueue[t.guild_id] ??= {};
            postQueue[t.guild_id][t.channel_id] ??= [];
            postQueue[t.guild_id][t.channel_id].push(t)
        }

        // POST/CREATE - For Each Guild/Post Channel(s) In Post Queue:
        for (const [guildId, channels] of Object.entries(postQueue)) {
            // Stats Count:
            let totalSessionsCreated = 0;

            // Fetch Guild Instance, Data, & Subscription:
            let guild: Guild | null = null;
            try {
                guild = await core.botClient.guilds.fetch(guildId)
            } catch (err) {
                createLog.for('Schedule').error('Failed to fetch GUILD for session creation - Likely Removed Bot? - See Details', { error: err, guildId, channels })
                const failedIds = Object.entries(channels).flatMap(([c, t]) => t.map(t => t?.id))
                await logTemplateFailure(failedIds)
                sendTemplateCreationAlert(guildId, 'Guild Fetch', failedIds)
                continue
            }
            const [guildSubscription, guildDbData] = await Promise.all([
                getGuildSubscriptionFromId(guildId),
                supabase.from('guilds').select('*').eq('id', guildId).single()
            ])
            // Guild /& Fetch Error:
            if (!guild || guildDbData.error || !guildDbData.data) {
                createLog.for('Database').error(`FAILED TO SAVE/CREATE - New Session - Couldn't fetch guild!`, { guildId, post_queue: channels, err: guildDbData.error, guild_fetched: guild?.name });
                const failedIds = Object.entries(channels).flatMap(([c, t]) => t.map(t => t?.id))
                await logTemplateFailure(failedIds)
                sendTemplateCreationAlert(guildId, 'Guild Fetch', failedIds)
                continue
            }

            // For EACH Post Channel w/ Session Templates:
            for (const [channelId, templates] of Object.entries(channels)) {
                // Fetch Channel:
                let channel: TextChannel = null;
                try {
                    const fetched = await guild.channels.fetch(channelId)
                    if (fetched.type == ChannelType.GuildText)
                        channel = fetched
                    else throw `Invalid Channel Type! - template.channel_id must be type of: ChannelType.GuildText!`
                } catch (err) {
                    const failedIds = templates.map(t => t.id)
                    if (isBotPermissionError(err)) {
                        createLog.for('Bot').info(`Couldn't fetch guild channel! - New Session - Missing Permissions`, { guildId, channelId, templates, err });
                        await logTemplateFailure(failedIds)
                        sendTemplateCreationAlert(guildId, 'Permissions', failedIds)
                    } else {
                        createLog.for('Bot').error(`Couldn't fetch guild channel! - New Session - See Details`, { guildId, channelId, templates, err });
                        await logTemplateFailure(failedIds)
                        sendTemplateCreationAlert(guildId, 'Guild Channel', failedIds)
                    }
                    continue;
                }
                // Confirm Channel is Sendable:
                if (!channel.isSendable()) {
                    // If channel isn't sendable:
                    createLog.for('Bot').info(`Couldn't use guild channel! - New Session - Missing Permissions`, { guildId, channelId, templates });
                    const failedIds = templates.map(t => t.id)
                    await logTemplateFailure(failedIds)
                    sendTemplateCreationAlert(guildId, 'Permissions', failedIds)
                    continue
                }


                // For each Session Template in Channel Queue:
                const sortedTemplates = templates.sort((a, b) => DateTime.fromISO(a.starts_at_utc).toSeconds() - DateTime.fromISO(b.starts_at_utc).toSeconds())
                for (const t of sortedTemplates) {
                    try {
                        // Get Vars:
                        const templateRsvps = t.rsvps ? mapRsvps(t.rsvps) : null;
                        const mentionRoles = guildSubscription.limits.ALLOW_MENTION_ROLES ? t.mention_roles : null;
                        /** The **EXACT start date** of this session in UTC time zone */
                        const sessionStart = DateTime.fromISO(t.next_post_utc).plus({ millisecond: t.post_before_ms });
                        /** The **BEGINNING of day** of this sessions start time in sessions specified time zone */
                        const dayInZone = sessionStart.setZone(t.time_zone).startOf('day')

                        // Create/Save new Session from Template:
                        const { error: createSessionErr, data: session } = await supabase.from('sessions').insert({
                            title: t.title,
                            description: t.description,
                            url: t.url,
                            time_zone: t.time_zone,
                            starts_at_utc: sessionStart.toISO(),
                            duration_ms: t.duration_ms,
                            guild_id: t.guild_id,
                            template_id: t.id,
                            channel_id: t.channel_id,
                            mention_roles: mentionRoles,
                            signup_id: '0',
                        }).select().single();
                        // If Creation/Save Error - Send Err Alert/Log - Continue:
                        if (createSessionErr || !session) {
                            createLog.for('Database').error('FAILED TO SAVE/CREATE - New Session - See Details...', { template: t, err: createSessionErr, session });
                            await logTemplateFailure([t.id])
                            sendTemplateCreationAlert(guildId, 'Session Save', [t.id])
                            continue;
                        }

                        // Create RSVP DB Rows:
                        if (templateRsvps && templateRsvps?.length) {

                            const { error: rsvpSaveErr } = await supabase.from('session_rsvp_slots').insert(
                                templateRsvps.map(data => ({
                                    title: data.name,
                                    emoji: data.emoji,
                                    capacity: data.capacity,
                                    roles_required: data.required_roles,
                                    session_id: session.id,
                                    guild_id: guildId
                                }))
                            )
                            if (rsvpSaveErr) {
                                // RSVP Save FAILED - Send Alert/Log - Mark to Continue:
                                createLog.for('Database').error('FAILED TO SAVE - RSVP SLOT(s) - See Details..', { session, guildId, templateId: t.id, rsvpSaveErr, rsvps: templateRsvps });
                                // Delete Created Session
                                // abortTemplateFromRsvpError = true;
                                await supabase.from('sessions').delete().eq('id', session.id);
                                // Send Failure Message:
                                await logTemplateFailure([t.id])
                                sendTemplateCreationAlert(guildId, 'RSVP Save', [t.id])
                                continue;
                            }
                        }

                        // Get Signup Destination - Channel or Thread:
                        let destinationChannel: TextThreadChannel | TextChannel = null;
                        if (t.post_in_thread) {
                            // Posting Session to Thread:
                            try {
                                // Compute Thread Title from Preferences:
                                const getThreadTitle = () => {
                                    let raw = guildDbData.data.thread_message_title;
                                    if (!raw || raw == 'DEFAULT') raw = API_GuildPreferencesDefaults.thread_message_title;
                                    return processVariableText(raw, { displayDate: dayInZone })
                                }
                                const threadTitle = getThreadTitle();

                                // Search for existing thread:
                                const threads = await channel.threads.fetch()
                                const existingThread = threads.threads.find(t => t.name == threadTitle && t.ownerId == core.botClient.user.id) as TextThreadChannel
                                if (existingThread) {
                                    // Existing Thread - Assign:
                                    destinationChannel = existingThread;
                                } else {
                                    // CREATING THREAD - Send "Thread Start" Message:
                                    // Compute Thread Description from Preferences:
                                    const getThreadDescription = () => {
                                        let raw = guildDbData.data.thread_message_description;
                                        if (!raw || raw == 'DEFAULT') raw = API_GuildPreferencesDefaults.thread_message_description;
                                        return processVariableText(raw, { displayDate: dayInZone })
                                    }
                                    const threadDescription = getThreadDescription();
                                    const threadStartMsg = await channel.send({
                                        components: [
                                            buildSessionThreadStartMsg(dayInZone, guildSubscription.limits.SHOW_WATERMARK, threadTitle, threadDescription, guildDbData.data.accent_color)
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
                                // Failed to Send Sessions Panel:
                                createLog.for('Schedule').warn(`Failed to get a template's destination thread! - See details...`, { err, channelId, session, template: t, guildId })
                                if (isBotPermissionError(err)) {
                                    sendTemplateCreationAlert(guildId, 'Permissions', [t.id])
                                } else {
                                    sendTemplateCreationAlert(guildId, 'Destination Channel', [t.id])
                                }
                                await logTemplateFailure([t.id])
                                // Clean up DB session + rsvps
                                await Promise.allSettled([
                                    supabase.from('session_rsvp_slots').delete().eq('session_id', session.id),
                                    supabase.from('sessions').delete().eq('id', session.id)
                                ])
                                // Continue to next template:
                                continue;
                            }


                        } else {
                            // Posting to Channel - Assign as Destination:
                            destinationChannel = channel;
                        }

                        // Post Session Panel to Discord:
                        const signupMsgContent = await buildSessionPanelMsg(session, guildSubscription.limits.SHOW_WATERMARK, guildDbData.data.accent_color, guildDbData.data?.calendar_button)
                        let signupMsg: Message
                        try {
                            signupMsg = await destinationChannel.send({
                                components: [signupMsgContent],
                                flags: MessageFlags.IsComponentsV2
                            })
                        } catch (err) {
                            // Failed to Send Sessions Panel:
                            createLog.for('Schedule').error('Failed to send session panel message', { guildId, channelId, session, error: err });
                            // Check & Alert Error:
                            if (isBotPermissionError(err)) {
                                sendTemplateCreationAlert(guildId, 'Permissions', [t.id])
                            } else {
                                sendTemplateCreationAlert(guildId, 'Session Panel', [t.id])
                            }
                            // Escalate Failure:
                            await logTemplateFailure([t.id])
                            // Clean up DB session + rsvps
                            await Promise.allSettled([
                                supabase.from('session_rsvp_slots').delete().eq('session_id', session.id),
                                supabase.from('sessions').delete().eq('id', session.id)
                            ])
                            // Continue to next template:
                            continue;
                        }

                        // Native Discord Event - Create if Enabled:
                        let event: GuildScheduledEvent | null = null;
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
                                    const showWatermark = guildSubscription.limits.SHOW_WATERMARK;
                                    const watermark = `${core.emojis.string('logo')} Powered by Sessions Bot | [Learn More](${URLS.website})`;

                                    if (!hasContent && !showWatermark) return null;
                                    if (!hasContent && showWatermark) return watermark;
                                    if (hasContent && !showWatermark) return raw;

                                    return `${raw}\n${watermark}`;
                                }

                                // Create Discord Native Event:
                                event = await guild.scheduledEvents.create({
                                    name: t.title,
                                    description: eventDescription(),
                                    scheduledStartTime: eventStart,
                                    scheduledEndTime: eventEnd,
                                    entityType: GuildScheduledEventEntityType.External,
                                    privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                                    entityMetadata: { location: t.url ? t.url : signupMsg.url },
                                })
                            } catch (err) {
                                // Discord Event Creation Error:
                                createLog.for('Bot').error('Failed to create a NATIVE EVENT for a session! - See Details..', { guildId, session, err })
                            }

                        }

                        // Update Signup Msg & Thread Id(s) for new Session in DB:
                        const { error: updateSessionErr } = await supabase.from('sessions').update({
                            signup_id: signupMsg.id,
                            thread_id: t.post_in_thread ? destinationChannel.id : null,
                            event_id: t.native_events ? event?.id : null
                        }).eq('id', session.id)
                        if (updateSessionErr) {
                            // Retry again:
                            const retry = await supabase.from('sessions').update({
                                signup_id: signupMsg.id,
                                thread_id: t.post_in_thread ? destinationChannel.id : null,
                                event_id: t.native_events ? event?.id : null
                            }).eq('id', session.id)
                            // On Retry Failure - Delete Session - Alert:
                            if (retry.error) {
                                // FAILED - Updating Session - Delete Invalid Database Results - Alert:
                                createLog.for('Database').error('FAILED TO UPDATE - Session on creation - Applying "true id(s)"', { updateSessionErr, session })
                                // Alert & Escalate Failure:
                                sendTemplateCreationAlert(guildId, 'Update Session', [t.id])
                                await logTemplateFailure([t.id])
                                // Clean up DB Session + RSVPs:
                                await Promise.allSettled([
                                    supabase.from('session_rsvp_slots').delete().eq('session_id', session.id),
                                    supabase.from('sessions').delete().eq('id', session.id)
                                ])
                                // If Discord Event Created - Delete:
                                if (event) {
                                    try { await event.delete(); } catch { }
                                }
                                // Continue to next template:
                                continue;
                            }
                        }

                        if (debugSchedule) console.info('[🧾] Session Created --', session.title, '--', session.id);

                        // Update Template - Next/Last Post UTC:
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
                            createLog.for('Database').error('FAILED TO UPDATE - Template Next/Last Post UTC(s) - See Details..', { error: updateTemplateErr, template: t, session })
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
                                createLog.for('Database').error('FAILED TO UPDATE - Template on session creation - Applying "true dates"', { updateTemplateErr, template: t, session })
                                // Alert & Escalate Failure:
                                sendTemplateCreationAlert(guildId, 'Update Template', [t.id])
                                await logTemplateFailure([t.id])
                                // Clean up DB Session + RSVPs:
                                await Promise.allSettled([
                                    supabase.from('session_rsvp_slots').delete().eq('session_id', session.id),
                                    supabase.from('sessions').delete().eq('id', session.id)
                                ])
                                // If Discord Event Created - Delete:
                                if (event) {
                                    try { await event.delete(); } catch { }
                                }
                                // Continue to next template:
                                continue;
                            }
                        }

                        // Session Created & Posted - Create Audit Event:
                        createAuditLog({
                            event: AuditEvent.SessionPosted,
                            guild: guildId,
                            user: core.botClient?.user?.id || null,
                            meta: { session_id: session.id }
                        })
                        // Increase Stat Counter:
                        totalSessionsCreated++;

                    } catch (err) {
                        // Individualized Template Creation - Errored - Log & Continue to Next Template:
                        createLog.for('Schedule').error('CRITICAL - Failed to post template scheduled for post! - See Details', { error: err });
                        // Alert & Escalate Failure:
                        sendTemplateCreationAlert(guildId, 'Unknown', [t.id])
                        await logTemplateFailure([t.id])
                        continue;
                    }

                }

            }

            // Increase Sessions Created Counter for Guild/App:
            if (totalSessionsCreated > 0) {
                await increaseGuildStat(guildId, 'sessions_created', totalSessionsCreated)
            }
        }

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