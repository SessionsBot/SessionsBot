import { ButtonBuilder, ButtonStyle, CommandInteraction, ComponentType, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import { Database, Result, SubscriptionLevel, SubscriptionSKUs } from "@sessionsbot/shared";
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
            const { colors: { getOxColor } } = core;

            // Get Guild Subscription:
            const subscriptions = i.entitlements.filter(e => (e.isActive() && e.isGuildSubscription)).map(s => s.skuId)
            const currentPlan = () => {
                if (subscriptions.includes(SubscriptionSKUs.ENTERPRISE)) return SubscriptionLevel.ENTERPRISE;
                else if (subscriptions.includes(SubscriptionSKUs.PREMIUM)) return SubscriptionLevel.PREMIUM;
                else return SubscriptionLevel.FREE;
            };

            // Fetch ACTIVE Sessions for Guild:
            const now = DateTime.utc().toISO()
            const { data: activeSessions, error: sessionsERR } = await supabase.from('sessions')
                .select('*')
                .eq('guild_id', i.guild.id)
                .gt('starts_at_utc', now)
                .select()
            if (sessionsERR) throw Result.err(sessionsERR, { message: `Failed to fetch "Active Sessions" for guild for /my-rsvps cmd`, guildId: i.guildId, userId: i.user.id })


            // Fetch user's current RSVPs for Active Session Ids:
            let userRsvps: Database['public']['Tables']['session_rsvps']['Row'][] = [];
            if (activeSessions.length) {
                const activeSessionIds = activeSessions.map(s => s.id);
                const { data, error } = await supabase.from('session_rsvps')
                    .select('*')
                    .in('session_id', activeSessionIds)
                    .eq('user_id', i.user.id)
                    .select()
                if (error) throw Result.err(error, { message: 'Failed to fetch users "Current RSVPS" for active sessions in guild!', guildId: i.guildId, userId: i.user.id })
                userRsvps = data;
            }

            // Fetch assigned RSVP SLOT data:
            let assignedSlotsData: Database['public']['Tables']['session_rsvp_slots']['Row'][] = [];
            if (userRsvps?.length) {
                const assignedSlotIds = userRsvps.map(r => r.rsvp_slot_id);
                const { data, error } = await supabase.from('session_rsvp_slots')
                    .select('*')
                    .in('id', assignedSlotIds)
                    .select()
                if (error) throw Result.err(error, { message: 'Failed to fetch users assigned "RSVPS SLOTS" data for /my-rsvps cmd!', guildId: i.guildId, userId: i.user.id })
                assignedSlotsData = data;
            }

            // Fetch assigned SESSION data:
            let assignedSessionsData: Database['public']['Tables']['sessions']['Row'][] = [];
            if (userRsvps?.length) {
                const assignedSessionIds = userRsvps.map(r => r.session_id);
                const { data, error } = await supabase.from('sessions')
                    .select('*')
                    .in('id', assignedSessionIds)
                    .select()
                if (error) throw Result.err(error, { message: 'Failed to fetch users assigned "RSVPS SLOTS" data for /my-rsvps cmd!', guildId: i.guildId, userId: i.user.id })
                assignedSessionsData = data;
            }



            // Util: Build Current RSVPs Section(s):
            const rsvpSections = (): any[] => {
                let li = []
                // If no RSVPs:
                if (!userRsvps?.length) return [
                    new TextDisplayBuilder({ content: `😢 You're currently not assigned to any **upcoming sessions** as an RSVP!` }),
                    new SeparatorBuilder()
                ]
                // Else - Map RSVPs:
                for (const r of userRsvps) {
                    const sessionData = assignedSessionsData.find(s => s.id = r.session_id);
                    const slotData = assignedSlotsData.find(s => s.id == r.rsvp_slot_id);
                    const rsvpTitle = slotData.emoji ? `${slotData.emoji} ${slotData.title}` : slotData.title;
                    li.push(
                        new SectionBuilder({
                            components: <any>[
                                new TextDisplayBuilder({ content: `### ${sessionData?.title} \n⏰: <t:${DateTime.fromISO(sessionData.starts_at_utc).toUnixInteger()}:f> \n💼: \`${rsvpTitle}\`` })
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                style: ButtonStyle.Secondary,
                                emoji: {
                                    id: core.emojis.ids.user_fail,
                                    name: 'user_fail'
                                },
                                custom_id: `unRsvp:${slotData.id.split('rsvp_')[1]}:${slotData.session_id}`
                            }
                        }),
                        new SeparatorBuilder()
                    )
                }
                return li;
            }

            // Build My Sessions Message:
            const msgBuild = new ContainerBuilder({
                accent_color: getOxColor('purple'),
                components: <any>[
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('user_success')} My RSVPs \n-# Below are your current RSVP assignments for upcoming sessions in this server.` }),
                    new SeparatorBuilder(),
                    ...rsvpSections()
                ]
            })

            // FREE PLAN - Add Watermark:
            if (currentPlan().limits.SHOW_WATERMARK) {
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