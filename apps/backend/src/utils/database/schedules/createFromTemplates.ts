import { dbIsoUtcToDateTime, getDurationMs } from "@sessionsbot/shared";
import { Log } from "../../logs/logtail";
import { supabase } from "../supabase"
import { DateTime } from "luxon";
import useRRule from "rrule";
import { object } from "zod";
import core from "../../core";
import { sendPermissionAlert } from "../../bot/permissions/permissionsDenied";

const { RRule } = useRRule;

export async function initTemplateCreationScheduler() {

    console.info(`[i] Initializing Template Creation Scheduler!`)

    // Fetch/load Session Templates -> Compute each metadata:
    const getTemplates = async () => {
        // Fetch All:
        const { data, error } = await supabase.from('session_templates').select('*');
        if (!data || !data?.length) {
            new Log('Database').error('Failed to load templates! - Creation Scheduler - CRITICAL', { details: 'The data object returned null? No results/RLS issues?' });
            return null;
        }
        if (error) {
            new Log('Database').error('Failed to load templates! - Creation Scheduler - CRITICAL', { details: error });
            return null;
        }

        // Filter Templates -> For Today ONLY & ALL RRuled:
        const filtered = data.map((t) => {
            // Get Dates:
            const today = DateTime.now().setZone(t.time_zone).startOf('day');
            const startDate = dbIsoUtcToDateTime(t.starts_at_utc, t.time_zone);

            // Get Recurrence:
            let rule = t.rrule ? RRule.fromString(t.rrule) : null
            if (rule) {
                // Create Fine-Tuned Rule:
                rule = new RRule({
                    ...rule.origOptions,
                    dtstart: startDate.toJSDate(),
                });
            }
            const first = rule ? rule.after(today.toJSDate(), true) : null;
            let nextRecurrenceDate = first ? DateTime.fromJSDate(first, { zone: t.time_zone }).set({ hour: startDate.hour, minute: startDate.minute }).startOf('minute') : null;


            // Determine if Start or Recurrence Dates are Today:
            const onlyToday = () => {
                if (!rule) {
                    return (startDate.hasSame(today, 'day'))
                } else return false;
            }
            const recurrenceToday = () => {
                if (nextRecurrenceDate) {
                    return (nextRecurrenceDate.hasSame(today, 'day'));
                } else
                    return false;
            }

            // Find Outdated Templates:
            const isOutdated = () => {
                // Check - Has more repeats after today;
                if (rule && rule?.after(today.toJSDate(), false)) {
                    // Has repeats - NOT Outdated:
                    return false;
                } else {
                    // Out of repeats:
                    const now = DateTime.now().setZone(t.time_zone)
                    const postAt = startDate.plus({ milliseconds: t.post_before_ms })
                    // Return Boolean - After last post:
                    return (now.toMillis() >= postAt.toMillis())
                }
            }

            // Template Metadata:
            const meta = {
                today: today?.toFormat('F'),
                startDate: startDate?.toFormat('F'),
                post_before_mins: Math.abs((t.post_before_ms / 1000) / 60),
                reccurance: rule ? rule.toText() : null,
                nextRecurrenceDate: nextRecurrenceDate ? nextRecurrenceDate.toFormat('F') : null,
                onlyToday: onlyToday(),
                recurrenceToday: recurrenceToday(),
                outdated: isOutdated()
            }

            // Return Template w/ Meta:
            return { ...t, meta };
        })

        // Return Templates:
        return filtered;
    }
    const templateFetch = await getTemplates()

    // Map by Guild Id > Channel Id & Deletions:
    let postQueue: { [guildId: string]: { [channelId: string]: typeof templateFetch } } = {};
    let deleteQueue: string[] = [];
    for (const t of templateFetch) {
        const { meta: { onlyToday, recurrenceToday, outdated }, id, guild_id, channel_id } = t;
        // Map template into post queue:
        if (onlyToday || recurrenceToday) {
            postQueue[guild_id] ??= {};
            postQueue[guild_id][channel_id] ??= [];
            postQueue[guild_id][channel_id].push(t)
        }
        // Add to deletion queue if applicable:
        if (outdated) {
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
                // supabase.from('sessions').insert({
                //     name: t.title,
                //     guild: guildId,
                //     time_zone: t.time_zone,
                //     starts_at_ms: DateTime.fromFormat(t.meta.nextRecurrenceDate, 'F').toMillis(),
                //     duration_ms: t.duration_ms,
                //     description: t?.description || null,
                //     url: t?.url || null
                // })

            }
        }
    }

    console.info('Template Load Results', { postQueue, deleteQueue })
}