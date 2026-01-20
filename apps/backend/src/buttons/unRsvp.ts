import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ContainerBuilder, GuildMember, MessageFlags, SeparatorBuilder, TextChannel, TextDisplayBuilder } from "discord.js";
import { supabase } from "../utils/database/supabase";
import { SubscriptionLevel, SubscriptionSKUs } from "@sessionsbot/shared";
import core from "../utils/core";
import { defaultFooterText, genericErrorMsg } from "../utils/bot/messages/basic";
import { buildSessionSignupMsg } from "../utils/bot/messages/sessionSignup";
import { DateTime } from "luxon";

export default {
    data: {
        customId: 'unRsvp'
    },
    execute: async (i: ButtonInteraction) => {
        // Vars:
        const {
            colors: { getOxColor },
            commands: { getLinkString: getCmdLink },
            urls
        } = core;
        const [_, rsvpId, sessionId] = i.customId.split(':');

        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Get Guild Subscription:
        const subscriptions = i.entitlements.filter(e => (e.isActive() && e.isGuildSubscription)).map(s => s.skuId)
        const currentPlan = () => {
            if (subscriptions.includes(SubscriptionSKUs.ENTERPRISE)) return SubscriptionLevel.ENTERPRISE;
            else if (subscriptions.includes(SubscriptionSKUs.PREMIUM)) return SubscriptionLevel.PREMIUM;
            else return SubscriptionLevel.FREE;
        };

        // Fetch Session:
        const { data: session, error: sessionERR } = await supabase.from('sessions')
            .select('*')
            .eq('id', sessionId)
            .select()
            .single()
        if (sessionERR) throw { message: `Failed to fetch session for UN-RSVP button interaction!`, details: { sessionId, err: sessionERR } };

        // Fetch RSVP Entry:
        const { data: rsvpAssignment, error: rsvpAssignmentERR } = await supabase.from('session_rsvps')
            .delete()
            .eq('session_id', sessionId)
            .eq('rsvp_slot_id', 'rsvp_' + rsvpId)
            .eq('user_id', i.user.id)
            .select()
            .maybeSingle()
        if (rsvpAssignmentERR) throw { message: `Failed to fetch session RSVP assignment for UN-RSVP button interaction!`, details: { sessionId, err: rsvpAssignmentERR } };

        // RSVP - Not Found - Alert & Return:
        if (!rsvpAssignment) {
            const alertMsg = new ContainerBuilder({
                accent_color: getOxColor('warning'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### 🤔 Hm! We cant find your RSVP Slot` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `According to our records you're already **not assigned** this RSVP slot within this session.` }),
                    new TextDisplayBuilder({ content: `-# Use the ${getCmdLink('my-sessions')} command to confirm your current RSVP assignments within this Discord Server.` })
                ]
            })
            if (currentPlan().limits.SHOW_WATERMARK) {
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
            if (i.message.id == session.signup_id) return i.message;
            else {
                const channel = await i.guild.channels.fetch(session.channel_id) as TextChannel;
                return await channel.messages.fetch(session.signup_id)
            }
        }
        const signupMsg = await getSignupMsg();
        if (!signupMsg) throw { message: 'Failed to fetch Signup Message Panel for RSVP interaction.', details: { session } }

        // Update Signup - New Content:
        const newSignupContent = await buildSessionSignupMsg(session);
        await signupMsg.edit({
            components: [newSignupContent]
        })

        // Success - Build & Send - UN-RSVPed Response:
        const successMsg = new ContainerBuilder({
            accent_color: getOxColor('warning'),
            components: <any>[
                new TextDisplayBuilder({ content: `### 🗑️ RSVP Removed!` }),
                // new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `-# View details below:` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `**Removed At:** \n> <t:${DateTime.now().toUnixInteger()}:f>` }),
                new SeparatorBuilder(),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            style: ButtonStyle.Link,
                            label: 'View Session',
                            url: signupMsg.url
                        })
                    ]
                })
            ]
        })
        // FREE PLAN - Add Watermark
        if (currentPlan().limits.SHOW_WATERMARK) {
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

    }
}