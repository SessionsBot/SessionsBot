import { ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import { Database, getSubscriptionFromInteraction, Result, SubscriptionLevel, SubscriptionSKUs } from "@sessionsbot/shared";
import core from "../../utils/core/core";
import { defaultFooterText } from "../../utils/bot/messages/basic";


export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('my-rsvps')
        .setDescription('View your current RSVP assignments for any upcoming sessions.')
    ,
    // Command Execution:
    execute: async (i: CommandInteraction) => {
        try {
            // Vars:
            const guildSubscription = getSubscriptionFromInteraction(i)

            // Fetch Assigned Sessions for User:
            const now = DateTime.utc().toISO()
            const { data: assignedSessions, error: sessionsERR } = await supabase.from('sessions')
                .select('*, session_rsvp_slots!inner(*, session_rsvps!inner(*))')
                .eq('guild_id', i.guild.id)
                .gt('starts_at_utc', now)
                .eq('session_rsvp_slots.session_rsvps.user_id', i.user.id)

            if (sessionsERR) throw Result.err(sessionsERR, { message: `Failed to fetch "Active Sessions" for guild for /my-rsvps cmd`, guildId: i.guildId, userId: i.user.id })


            // Util: Build Current RSVPs Section(s):
            const rsvpSections = (): any[] => {
                let li = []
                // If no RSVPs:
                if (!assignedSessions?.length) return [
                    new TextDisplayBuilder({ content: `> 😢 You're currently not assigned to any **__upcoming sessions__** as an RSVP!` }),
                    new SeparatorBuilder()
                ]
                // Else - Map RSVPs:
                for (const s of assignedSessions) {
                    // const sessionData = assignedSessionsData.find(s => s.id = r.session_id);
                    const slotData = s.session_rsvp_slots.find(s => s.session_rsvps.some(r => r.user_id))
                    // const rsvpTitle = slotData.emoji ? `${slotData.emoji} ${slotData.title}` : slotData.title;
                    li.push(
                        new SectionBuilder({
                            components: <any>[
                                new TextDisplayBuilder({ content: `### ${s?.title} \n${core.emojis.string('clock')}: <t:${DateTime.fromISO(s.starts_at_utc).toUnixInteger()}:f> \n${core.emojis.string('briefcase')}: \`${slotData?.title}\`` })
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                style: ButtonStyle.Secondary,
                                emoji: {
                                    id: core.emojis.ids.user_fail,
                                    name: 'user_fail'
                                },
                                custom_id: `unRsvp:${slotData.id}:${slotData.session_id}`
                            }
                        }),
                        new SeparatorBuilder()
                    )
                }
                return li;
            }

            // Build My Sessions Message:
            const msgBuild = new ContainerBuilder({
                accent_color: core.colors.getOxColor('purple'),
                components: <any>[
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('user_success')}  My RSVPs \n-# Below are your current RSVP assignments for upcoming sessions in this server.` }),
                    new SeparatorBuilder(),
                    ...rsvpSections()
                ]
            })

            // FREE PLAN - Add Watermark:
            if (guildSubscription.limits.SHOW_WATERMARK) {
                msgBuild.components.push(defaultFooterText())
            }

            // Send My Sessions Response:
            await i.reply({
                components: [msgBuild],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            })

        } catch (err) {
            // Execution Error:
            throw err
        }
    }
}