import { calculateNextPostUTC, mapRsvps } from "@sessionsbot/shared";
import { useLogger } from "../../logs/logtail";
import { supabase } from "../supabase"
import { DateTime } from "luxon";
import core from "../../core";
import { sendPermissionAlert } from "../../bot/permissions/permissionsDenied";
import { timeToUntilString } from "rrule/dist/esm/dateutil";
import { sendFailedToPostSessionAlert } from "../../bot/permissions/failedToSendMsg";
import { buildSessionSignupMsg } from "../../bot/messages/sessionSignup";
import { MessageFlags } from "discord.js";
import cron, { ScheduledTask } from 'node-cron'

const createLog = useLogger();

/** The `ScheduledTask` obj of the Session Template creation schedule */
let sessionTemplateCreationCron: ScheduledTask = null;


/** Session Template Creation Schedule - **Execution** - Scans templates that are overdue for post -> posts them!*/
async function executeTemplateCreationSchedule() {

    console.info(`(i) Template Creation Schedule - Running at ${DateTime.now().toFormat('F')}`)

    // Fetch/load Session Templates -> PAST NOW 'next_post_utc':
    const getTemplates = async (fromUTC: DateTime) => {
        // Fetch Templates:
        const { data, error } = await supabase
            .from('session_templates')
            .select('*')
            .lte('next_post_utc', fromUTC.toISO())
        // Catch Fetch Errors:
        if (!data || !data?.length) {
            console.info(`(i) Template Fetch - Returned 0 results due for next post!`)
            return null;
        }
        if (error) {
            createLog.for('Database').error('Failed to load templates! - Creation Scheduler - CRITICAL', { details: error });
            return null;
        }
        // Return Templates:
        return data;
    }
    const fromUTC = DateTime.now().toUTC() // .plus({ minute: 5 })
    const templateFetch = await getTemplates(fromUTC);
    if (!templateFetch) return;

    // Map Overdue Templates into "Post" Queue:
    let postQueue: { [guildId: string]: { [channelId: string]: typeof templateFetch } } = {};
    for (const t of templateFetch) {
        postQueue[t.guild_id] ??= {};
        postQueue[t.guild_id][t.channel_id] ??= [];
        postQueue[t.guild_id][t.channel_id].push(t)
    }

    // POST/CREATE - For Each Guild/Template In Post Queue:
    for (const [guildId, channels] of Object.entries(postQueue)) {
        // Fetch Guild:
        const guild = await core.botClient.guilds.fetch(guildId);
        // For each post channel in guild:
        for (const [channelId, templates] of Object.entries(channels)) {
            // Fetch Channel:
            const channel = await guild.channels.fetch(channelId);
            if (!channel.isSendable()) {
                // If channel isn't sendable:
                await sendFailedToPostSessionAlert(guildId, channelId, templates.map(t => t.id))
                continue
            }
            // For each Session Template in Channel Queue:
            for (const t of templates) {
                // Get Vars:
                const sessionStart = DateTime.fromISO(t.next_post_utc).plus({ millisecond: t.post_before_ms });
                const sessionRsvps = t.rsvps ? mapRsvps(t.rsvps) : null;

                // Save/Create new Session from Template:
                const { error: saveErr, data: session } = await supabase.from('sessions').insert({
                    title: t.title,
                    description: t.description,
                    url: t.url,
                    time_zone: t.time_zone,
                    starts_at_ms: sessionStart.toMillis(),
                    duration_ms: t.duration_ms,
                    guild_id: t.guild_id,
                    template_id: t.id,
                    channel_id: t.channel_id,
                    signup_id: '0'
                }).select().single();

                // On Save Error:
                if (saveErr || !session) {
                    createLog.for('Database').error('FAILED TO SAVE/CREATE - New Session - See Details...', { template: t, err: saveErr, session });
                    continue;
                }

                // Create RSVP DB Rows:
                if (sessionRsvps) {
                    for (const [id, data] of sessionRsvps) {
                        const { error: rsvpSaveErr } = await supabase.from('session_rsvp_slots').insert({
                            title: data.name,
                            emoji: data.emoji,
                            capacity: data.capacity,
                            session_id: session.id,
                            guild_id: guildId
                        })
                        if (rsvpSaveErr) {
                            createLog.for('Database').error('FAILED TO SAVE - RSVP SLOT - See Details..', { session, guildId, templateId: t.id, rsvpSaveErr, rsvpData: { id, data } });
                        }
                    }
                }

                // Post to Discord:
                const signupMsg = await channel.send({
                    components: [buildSessionSignupMsg(t, session.id)],
                    flags: MessageFlags.IsComponentsV2
                })

                // Update Signup Msg Id to Session in DB:
                const { error: updateSessionErr } = await supabase.from('sessions').update({
                    signup_id: signupMsg.id
                }).eq('id', session.id)
                if (updateSessionErr) {
                    createLog.for('Database').error('FAILED TO UPDATE - Session on creation - Applying "signup_id"', { updateSessionErr, session, guildId })
                }

                console.info('Session Created', session.title, session.id);

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
            }
        }
    }

}


/** Initializes the session template creation schedule.
 * @runs every 5 mins of each hour */
export async function initTemplateCreationScheduler() {
    console.info(`(i) Initializing Template Creation Scheduler! - At: ${DateTime.now().toFormat('F')}`)
    sessionTemplateCreationCron = cron.schedule(`*/5 * * * *`, executeTemplateCreationSchedule, {
        timezone: 'UTC', name: 'template_creation'
    })

    console.log(sessionTemplateCreationCron.getNextRun())
}