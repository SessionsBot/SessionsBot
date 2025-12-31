import { dbIsoUtcToDateTime, getTemplateMeta } from "@sessionsbot/shared";
import { Log } from "../../logs/logtail";
import { supabase } from "../supabase"
import { DateTime } from "luxon";
import RRulePkg from "rrule";
import core from "../../core";
import { sendPermissionAlert } from "../../bot/permissions/permissionsDenied";

const { RRule } = RRulePkg;

export async function initTemplateCreationScheduler() {

    console.info(`[i] Initializing Template Creation Scheduler!`)

    // Fetch/load Session Templates -> Compute each metadata:
    const getTemplates = async () => {
        // Fetch All Templates:
        const { data, error } = await supabase.from('session_templates').select('*');
        // Catch Fetch Errors:
        if (!data || !data?.length) {
            new Log('Database').error('Failed to load templates! - Creation Scheduler - CRITICAL', { details: 'The data object returned null? No results/RLS issues?' });
            return null;
        }
        if (error) {
            new Log('Database').error('Failed to load templates! - Creation Scheduler - CRITICAL', { details: error });
            return null;
        }

        // Get meta for each template:
        const templatesWithMeta = data.map((t) => {
            const meta = getTemplateMeta(t);
            return {
                ...t,
                meta
            }
        })

        // Return Templates:
        return templatesWithMeta;
    }
    const templateFetch = await getTemplates()

    // ! REVISED TO HERE ... 

    console.info(templateFetch)

    // Map by Guild Id > Channel Id & Deletions:
    let postQueue: { [guildId: string]: { [channelId: string]: typeof templateFetch } } = {};
    let deleteQueue: string[] = [];
    for (const t of templateFetch) {
        const { meta: { postsToday, templateOutdated }, id, guild_id, channel_id } = t;
        // Map template into post queue:
        if (postsToday) {
            postQueue[guild_id] ??= {};
            postQueue[guild_id][channel_id] ??= [];
            postQueue[guild_id][channel_id].push(t)
        }
        // Add to deletion queue if applicable:
        if (templateOutdated) {
            deleteQueue.push(id);
        }
    }

    // POST/CREATE - For Each Guild In Post Queue:
    for (const [guildId, channels] of Object.entries(postQueue)) {
        // fetch guild:
        const guild = await core.botClient.guilds.fetch(guildId);
        // For each post channel in guild:
        for (const [channelId, templates] of Object.entries(channels)) {
            // fetch channel:
            const channel = await guild.channels.fetch(channelId);
            // for each session template in channel:
            for (const t of templates) {
                // Create new "sessions" table entry:
                const { error: saveErr, data: saveData } = await supabase.from('sessions').insert({
                    title: t.title,
                    description: t.description,
                    url: t.url,
                    time_zone: t.time_zone,
                    starts_at_ms: DateTime.fromFormat(t.meta.nextRecurrenceDate, 'F').toMillis(),
                    duration_ms: t.duration_ms,
                    guild_id: t.guild_id,
                    template_id: t.id
                })

                if (!saveData || saveErr) {
                    console.info('CREATE SESSION ERR!', { saveData, saveErr })
                } else {
                    console.log('SESSION CREATED', saveData)
                }



            }
        }
    }

    console.info('Template Load Results', { postQueue, deleteQueue })
}