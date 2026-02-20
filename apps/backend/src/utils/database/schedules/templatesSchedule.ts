import { calculateNextPostUTC, mapRsvps, AuditEvent, API_GuildPreferencesDefaults } from "@sessionsbot/shared";
import { useLogger } from "../../logs/logtail";
import { supabase } from "../supabase"
import { DateTime } from "luxon";
import core from "../../core/core";
import { sessionPostFailedFromPerms } from "../../bot/permissions/failedToSendMsg";
import { buildSessionSignupMsg, buildSessionThreadStartMsg } from "../../bot/messages/sessionSignup";
import { ChannelType, GuildScheduledEvent, GuildScheduledEventEntityType, GuildScheduledEventPrivacyLevel, MessageFlags, TextChannel, TextThreadChannel, ThreadAutoArchiveDuration } from "discord.js";
import cron, { ScheduledTask } from 'node-cron'
import { genericErrorMsg } from "../../bot/messages/basic";
import sendWithFallback from "../../bot/messages/sendWithFallback";
import { createAuditLog } from "../auditLog";
import { getGuildSubscriptionFromId } from "../../bot/entitlements";
import { URLS } from "../../core/urls";
import { processVariableText } from "../../bot/messages/variableText";
import { increaseGuildStat } from "../manager/statsManager";

const createLog = useLogger();
const debugSchedule = true;

/** The `ScheduledTask` obj of the Session Template creation schedule */
let sessionTemplateCreationCron: ScheduledTask = null;


/** Session Template Creation Schedule - **Execution** - Scans templates that are overdue for post -> posts them!*/
async function executeTemplateCreationSchedule() {

    if (debugSchedule) console.info(`[⏰] Template Creation Schedule - Executing at ${DateTime.now().toFormat('F')}`)

    // Fetch/load Session Templates -> PAST NOW 'next_post_utc':
    const getTemplates = async (fromUTC: DateTime) => {
        // Fetch Templates:
        const { data, error } = await supabase
            .from('session_templates')
            .select('*')
            .lte('next_post_utc', fromUTC.toISO())
        // No Results Returned:
        if (!data || !data?.length) {
            if (debugSchedule) console.info(`[⏰] Template Fetch - Returned 0 results due for next post!`)
            return null;
        }
        // Catch Fetch Errors:
        if (error) {
            createLog.for('Database').error('Failed to load templates! - Creation Scheduler - CRITICAL', { details: error });
            return null;
        }
        // Return Templates:
        return data;
    }
    const templateFetch = await getTemplates(DateTime.now().toUTC());
    if (!templateFetch || !templateFetch.length) return;

    // Map Overdue Templates into "Post" Queue:
    let postQueue: { [guildId: string]: { [channelId: string]: typeof templateFetch } } = {};
    for (const t of templateFetch) {
        postQueue[t.guild_id] ??= {};
        postQueue[t.guild_id][t.channel_id] ??= [];
        postQueue[t.guild_id][t.channel_id].push(t)
    }

    // POST/CREATE - For Each Guild/Template In Post Queue:
    for (const [guildId, channels] of Object.entries(postQueue)) {
        // Stats Count:
        let totalSessionsCreated = 0;

        // Fetch Guild & Subscription:
        const [guild, guildSubscription, guildDbData] = await Promise.all([
            core.botClient.guilds.fetch(guildId),
            getGuildSubscriptionFromId(guildId),
            supabase.from('guilds').select('*').eq('id', guildId).select().single()
        ])

        if (!guild || guildDbData.error || !guildDbData.data) {
            createLog.for('Database').error(`FAILED TO SAVE/CREATE - New Session - Couldn't fetch guild!`, { guildId, post_queue: channels, err: guildDbData.error });
            // Send Failure Message:
            const errMsg = genericErrorMsg({ reasonDesc: `We failed to post one of your sessions due to a database error!, This shouldn't be happening, check our [status page](${URLS.status_page}) or get in touch with our [Bot Support](${URLS.support_chat}) team! \n**Support Details:** \`\`\`Guild Id: ${guildId} \nCause: Guild data fetch failure \`\`\`` })
            sendWithFallback(guildId, errMsg);
            continue;
        }

        // For each post channel in guild:
        for (const [channelId, templates] of Object.entries(channels)) {
            // Fetch Channel:
            const channel = await guild.channels.fetch(channelId) as TextChannel;
            await channel.threads.fetch()

            if (!channel.isSendable()) {
                // If channel isn't sendable:
                await sessionPostFailedFromPerms(guildId, channelId, templates.map(t => t.id))
                continue
            }


            // For each Session Template in Channel Queue:
            const sortedTemplates = templates.sort((a, b) => DateTime.fromISO(a.starts_at_utc).toSeconds() - DateTime.fromISO(b.starts_at_utc).toSeconds())
            for (const t of sortedTemplates) {
                // Get Vars:
                const sessionStart = DateTime.fromISO(t.next_post_utc).plus({ millisecond: t.post_before_ms });
                const templateRsvps = t.rsvps ? mapRsvps(t.rsvps) : null;
                const mentionRoles = guildSubscription.limits.ALLOW_MENTION_ROLES ? t.mention_roles : null;

                // Save/Create new Session from Template:
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
                // If Create/Save Error - Continue:
                if (createSessionErr || !session) {
                    createLog.for('Database').error('FAILED TO SAVE/CREATE - New Session - See Details...', { template: t, err: createSessionErr, session });
                    // Send Failure Message:
                    const errMsg = genericErrorMsg({ reasonDesc: `We failed to post one of your sessions due to a database error!, This shouldn't be happening, check our [status page](${URLS.status_page}) or get in touch with our [Bot Support](${URLS.support_chat}) team! \n**Support Details:** \`\`\`Template Id: ${t.id} \nGuild Id: ${t.guild_id} \`\`\`` })
                    sendWithFallback(guildId, errMsg);
                    continue;
                }

                // Create RSVP DB Rows:
                let abortTemplateFromRsvpErr = false;
                if (templateRsvps) {
                    for (const data of templateRsvps) {
                        const { error: rsvpSaveErr } = await supabase.from('session_rsvp_slots').insert({
                            title: data.name,
                            emoji: data.emoji,
                            capacity: data.capacity,
                            roles_required: data.required_roles,
                            session_id: session.id,
                            guild_id: guildId
                        }).select('*').single()
                        if (rsvpSaveErr) {
                            abortTemplateFromRsvpErr = true;
                            // RSVP Save FAILED:
                            createLog.for('Database').error('FAILED TO SAVE - RSVP SLOT - See Details..', { session, guildId, templateId: t.id, rsvpSaveErr, rsvpData: data });
                            // Delete Created Session
                            await supabase.from('sessions').delete().eq('id', session.id);
                            // Send Failure Message:
                            const errMsg = genericErrorMsg({ reasonDesc: `We failed to post one of your sessions due to a database error!, This shouldn't be happening, check our [status page](${URLS.status_page}) or get in touch with our [Bot Support](${URLS.support_chat}) team! \n**Support Details:** \`\`\`Template Id: ${t.id} \nGuild Id: ${t.guild_id} \`\`\`` })
                            sendWithFallback(guildId, errMsg);
                            break;
                        }
                    }
                    if (abortTemplateFromRsvpErr) {
                        continue;
                    }
                }

                // Get Signup Destination - Channel or Thread:
                let destinationChannel: TextThreadChannel | TextChannel = null;
                if (t.post_in_thread) {
                    // Post inside Thread:
                    const rawThreadTitle = () => {
                        const rawTitleSave = guildDbData.data.thread_message_title
                        if (!rawTitleSave || rawTitleSave == 'DEFAULT') {
                            // Apply default
                            return API_GuildPreferencesDefaults.thread_message_title
                        } else return rawTitleSave
                    }
                    const dayInZone = sessionStart.setZone(t.time_zone).startOf('day')
                    const threadTitle = processVariableText(rawThreadTitle(), { displayDate: dayInZone })

                    // Search for existing thread:
                    const existingThread = channel.threads.cache.find(t => t.name == threadTitle)
                    if (existingThread) {
                        // Existing Thread - Assign:
                        destinationChannel = existingThread;
                    }
                    else {
                        // CREATING THREAD - Send "Thread Start" Message:
                        const rawThreadDesc = () => {
                            const rawDescSave = guildDbData.data.thread_message_description
                            if (!rawDescSave || rawDescSave == 'DEFAULT') {
                                // Apply default
                                return API_GuildPreferencesDefaults.thread_message_description
                            } else return rawDescSave
                        }
                        const threadDescription = processVariableText(rawThreadDesc(), { displayDate: dayInZone })
                        const threadStartMsg = await channel.send({
                            components: [
                                buildSessionThreadStartMsg(dayInZone, guildSubscription.limits.SHOW_WATERMARK, threadTitle, threadDescription, guildDbData.data.accent_color)
                            ],
                            flags: MessageFlags.IsComponentsV2
                        })
                        // Create NEW Thread for Day - Assign:
                        const thread = await channel.threads.create({
                            name: threadTitle,
                            autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
                            startMessage: threadStartMsg,
                            type: ChannelType.PublicThread
                        })
                        destinationChannel = thread;
                    }

                } else {
                    // Posting to Channel:
                    destinationChannel = channel;
                }

                // Post to Discord:
                const signupMsgContent = await buildSessionSignupMsg(session, guildSubscription.limits.SHOW_WATERMARK, guildDbData.data.accent_color, guildDbData.data?.calendar_button)
                const signupMsg = await destinationChannel.send({
                    components: [signupMsgContent],
                    flags: MessageFlags.IsComponentsV2
                })

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

                        // Create Discord Native Event:
                        event = await guild.scheduledEvents.create({
                            name: t.title,
                            description: t.description?.slice(0, 1000) || null,
                            scheduledStartTime: eventStart,
                            scheduledEndTime: eventEnd,
                            entityType: GuildScheduledEventEntityType.External,
                            privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                            entityMetadata: { location: t.url ? t.url : signupMsg.url },
                        })
                    } catch (err) {
                        // Event Creation Error:
                        createLog.for('Bot').error('Failed to create a NATIVE EVENT for a session! - See Details..', { guildId, session, err })
                    }

                }

                // Update Signup Msg & Thread Id(s) to Session in DB:
                const { error: updateSessionErr } = await supabase.from('sessions').update({
                    signup_id: signupMsg.id,
                    thread_id: t.post_in_thread ? destinationChannel.id : null,
                    event_id: t.native_events ? event?.id : null
                }).eq('id', session.id)
                if (updateSessionErr) {
                    createLog.for('Database').error('FAILED TO UPDATE - Session on creation - Applying "signup_id"', { updateSessionErr, session })
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
                const { error: updateErr } = await supabase
                    .from('session_templates')
                    .update({
                        next_post_utc: newNextPostUTC?.toISO() || null,
                        last_post_utc: DateTime.now().toUTC().toISO()
                    })
                    .eq('id', t.id)
                if (updateErr) {
                    createLog.for('Database').error('FAILED TO UPDATE - Template Next/Last Post UTC(s) - See Details..', { updateErr, template: t, session })
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
            }
        }

        // Increase Sessions Created Counter for Guild/App:
        if (totalSessionsCreated > 0) {
            await increaseGuildStat(guildId, 'sessions_created', totalSessionsCreated)
        }
    }

}


/** Initializes the session template creation schedule.
 * @runs every 5 mins of each hour */
export async function initTemplateCreationScheduler(opts?: { runOnExecution?: boolean }) {
    if (debugSchedule) console.info(`[⏰] Initializing Template Creation Scheduler! - At: ${DateTime.now().toFormat('F')}`)
    sessionTemplateCreationCron = cron.schedule(`*/5 * * * *`, executeTemplateCreationSchedule, {
        timezone: 'UTC', name: 'template_creation'
    })

    // Catch - Execution Errors:
    sessionTemplateCreationCron.on("execution:failed", (ctx) => {
        const { execution } = ctx;
        createLog.for('Schedule').error('EXECUTION FAILED! - CRITICAL - See Details..', { details: execution })
    })

    if (opts?.runOnExecution) {
        if (debugSchedule) console.info(`[⏰] Running Session Template Creation Schedule Early..`)
        sessionTemplateCreationCron.execute()
    }
}