import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, TextChannel, TextDisplayBuilder } from "discord.js";
import { supabase } from "../utils/database/supabase";
import { getSubscriptionFromInteraction, AuditEvent } from "@sessionsbot/shared";
import core from "../utils/core/core";
import { defaultFooterText } from "../utils/bot/messages/basic";
import { buildSessionPanelMsg } from "../utils/bot/messages/sessionSignup";
import { DateTime } from "luxon";
import { createAuditLog } from "../utils/database/auditLog";

export default {
    data: {
        customId: 'unRsvp'
    },
    execute: async (i: ButtonInteraction) => {
        // Vars:
        const {
            colors: { getOxColor },
        } = core;
        const [_, rsvpId, sessionId] = i.customId.split(':');

        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Get Guild Subscription:
        const subscription = getSubscriptionFromInteraction(i)

        // Fetch Session/Guild Data:
        const [guildDbFetch, sessionDbFetch, rsvpAssignmentFetch] = await Promise.all([
            supabase.from('guilds').select('*').eq('id', i.guildId).single(),
            supabase.from('sessions')
                .select('*')
                .eq('id', sessionId)
                .select()
                .single(),
            supabase.from('session_rsvps')
                .delete()
                .eq('session_id', sessionId)
                .eq('rsvp_slot_id', 'rsvp_' + rsvpId)
                .eq('user_id', i.user.id)
                .select()
                .maybeSingle()
        ])
        const { data: session, error: sessionERR } = sessionDbFetch;
        const { data: guild, error: guildERR } = guildDbFetch;
        const { data: rsvpAssignment, error: rsvpAssignmentERR } = rsvpAssignmentFetch;

        // Fetch Errors:
        if (!guild || guildERR) throw { message: 'Failed to fetch guild data for rsvp interaction!', details: { session, err: guildDbFetch.error } }
        if (!session || sessionERR) throw { message: `Failed to fetch session data for RSVP button interaction!`, details: { session, err: sessionERR } };
        if (rsvpAssignmentERR) throw { message: `Failed to fetch session RSVP assignment for UN-RSVP button interaction!`, details: { sessionId, err: rsvpAssignmentERR } };

        // RSVP - Not Found - Alert & Return:
        if (!rsvpAssignment) {
            const alertMsg = new ContainerBuilder({
                accent_color: getOxColor('warning'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### ${core.emojis.string('warning')} Hm! We cant find your RSVP Slot` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `According to our records you're already **not assigned** this RSVP slot within this session.` }),
                    new TextDisplayBuilder({ content: `-# Use the ${core.commands.getLinkString('my-rsvps')} command to confirm your current RSVP assignments within this Discord Server.` })
                ]
            })
            if (subscription.limits.SHOW_WATERMARK) {
                alertMsg.components.push(new SeparatorBuilder(), defaultFooterText({ lightFont: true, showHelpLink: true }))
            }
            await i.editReply({
                components: [alertMsg],
                flags: MessageFlags.IsComponentsV2
            })
            return;
        }

        // Get Signup Message:
        const getSignupMsg = async () => {
            if (i.message.id === session.signup_id) return await i.message.fetch();
            else {
                const channel = await i.guild.channels?.fetch(session?.thread_id || session?.channel_id) as TextChannel;
                return await channel?.messages?.fetch(session?.signup_id)
            }
        }
        const signupMsg = await getSignupMsg();
        if (!signupMsg) throw { message: 'Failed to fetch Signup Message Panel for RSVP interaction.', details: { session } }

        // Update Signup - New Content:
        const newSignupContent = await buildSessionPanelMsg(session, subscription.limits.SHOW_WATERMARK, guild.accent_color, guild.calendar_button);
        await signupMsg.edit({
            components: [newSignupContent]
        })

        // Success - Build & Send - UN-RSVPed Response:
        const successMsg = new ContainerBuilder({
            accent_color: getOxColor('warning'),
            components: <any>[
                new TextDisplayBuilder({ content: `### ${core.emojis.string('user_fail')} RSVP Removed!` }),
                // new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `-# View details below:` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `**Removed At:** \n> <t:${DateTime.now().toUnixInteger()}:f>` }),
                new SeparatorBuilder(),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            style: ButtonStyle.Link,
                            emoji: { name: 'eye', id: core.emojis.ids.eye },
                            label: 'View Session',
                            url: signupMsg.url
                        })
                    ]
                })
            ]
        })
        // FREE PLAN - Add Watermark
        if (subscription.limits.SHOW_WATERMARK) {
            successMsg.components.push(
                new SeparatorBuilder(),
                defaultFooterText({ lightFont: true })
            )
        }
        // Send Final Response:
        await i.editReply({
            components: [successMsg],
            flags: MessageFlags.IsComponentsV2
        })

        // Create Audit Event:
        createAuditLog({
            event: AuditEvent.RsvpDeleted,
            guild: i.guildId,
            user: i.user.id,
            meta: {
                username: i.user.username,
                session_id: session.id,
                rsvp_id: 'rsvp_' + rsvpId
            }
        })

    }
}