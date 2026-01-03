import { calculateNextPostUTC, getTemplateMeta } from "@sessionsbot/shared";
import { useLogger } from "../../logs/logtail";
import { supabase } from "../supabase"
import { DateTime } from "luxon";
import core from "../../core";
import { sendPermissionAlert } from "../../bot/permissions/permissionsDenied";

const createLog = useLogger();

/** *Local Util*: Delete templates in database by an array of ids. */
async function deleteTemplates(ids: string[]) {
    if (!ids?.length) return;
    // Delete Templates:
    const { count, error } = await supabase.from('session_templates')
        .delete({ count: 'exact' })
        .in('id', ids)
    if (error) {
        // Database Error:
        createLog.for('Database').error('Failed to delete session templates! - See details..', { error });
        return;
    }
    if (count) {
        // Successfully deleted:
        createLog.for('Database').info(`Deleted ${count} Session Templates - From Creation Scheduler...`)
    }

}

/** *Awaiting Description...* */
export async function initTemplateCreationScheduler() {

    console.info(`[i] Initializing Template Creation Scheduler!`)

    // Fetch/load Session Templates -> Compute each metadata:
    const getTemplates = async (fromUTC: DateTime) => {
        // Fetch Templates:
        const { data, error } = await supabase
            .from('session_templates')
            .select('*')
            .or(`next_post_utc.lte.${fromUTC.toISO()},next_post_utc.is.null`);
        // Catch Fetch Errors:
        if (!data || !data?.length) {
            console.info(`(i) Template Fetch - Returned no results due for next post!`)
            return null;
        }
        if (error) {
            createLog.for('Database').error('Failed to load templates! - Creation Scheduler - CRITICAL', { details: error });
            return null;
        }
        // Get meta for each template:
        const templatesWithMeta = data.map(t => {
            const meta = getTemplateMeta(t);
            return {
                ...t,
                meta
            }
        })
        // Return Templates:
        return templatesWithMeta;
    }
    const fromUTC = DateTime.now().toUTC() // .plus({ minute: 5 })
    const templateFetch = await getTemplates(fromUTC);
    if (!templateFetch) return;

    // Map Templates into "Post" and "Delete" Queues:
    let postQueue: { [guildId: string]: { [channelId: string]: typeof templateFetch } } = {};
    let deleteQueue: string[] = [];
    for (const t of templateFetch) {
        // Get Variables:
        const { meta: { postsToday, nextPost, templateOutdated }, id, guild_id, channel_id } = t;
        const nowInZone = DateTime.now().setZone(t.time_zone);
        // Map template into post queue:
        if (postsToday && nextPost.toSeconds() >= nowInZone.toSeconds()) {
            postQueue[guild_id] ??= {};
            postQueue[guild_id][channel_id] ??= [];
            postQueue[guild_id][channel_id].push(t)
        }
        // Add to deletion queue if applicable:
        if (templateOutdated) {
            deleteQueue.push(id);
        }
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
                sendPermissionAlert(guildId);
                continue;
            }
            // For each Session Template in Channel:
            for (const t of templates) {
                // Create new Session from Template:
                const { error: saveErr, data: session } = await supabase.from('sessions').insert({
                    title: t.title,
                    description: t.description,
                    url: t.url,
                    time_zone: t.time_zone,
                    starts_at_ms: t.meta.nextPost.minus({ millisecond: t.post_before_ms }).toMillis(),
                    duration_ms: t.duration_ms,
                    guild_id: t.guild_id,
                    template_id: t.id
                }).select().single();

                // On Save Error:
                if (saveErr || !session) {
                    createLog.for('Database').error('FAILED TO SAVE - New Session - See Details...', { template: t, err: saveErr, session });
                    continue;
                }

                console.info('Session Created', session);

                // Post to Discord:
                await channel.send(`This is a signup message for session \`${session.id}\` `)

                // Update Template - Next/Last Post UTC:
                const nextPostUTC = calculateNextPostUTC({
                    startDate: t.meta.first.date,
                    zone: t.time_zone,
                    postOffsetMs: t.post_before_ms,
                    rrule: t.rrule,
                    // referenceDate: DateTime.now(),
                });
                console.info('Next Post for template', t.id, { next: nextPostUTC?.toFormat('F'), ISO: nextPostUTC?.toISO() });
                const { error: updateErr } = await supabase
                    .from('session_templates')
                    .update({
                        next_post_utc: nextPostUTC?.toISO() || null,
                        last_post_utc: DateTime.now().toUTC().toISO()
                    })
                    .eq('id', t.id)
                if (updateErr) {
                    createLog.for('Database').error('FAILED TO UPDATE - Template Next/Last Post UTC(s) - See Details..', { updateErr, template: t, session })
                }
            }
        }
    }

    // DELETE - Start async deletion for "Outdated" Templates:
    deleteTemplates(deleteQueue);

    console.info('Template Load Results', { postQueue, deleteQueue })
}