import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ContainerBuilder, GuildMember, MessageFlags, SeparatorBuilder, TextChannel, TextDisplayBuilder } from "discord.js";
import { supabase } from "../utils/database/supabase";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import core from "../utils/core";
import { defaultFooterText, genericErrorMsg } from "../utils/bot/messages/basic";
import { buildSessionSignupMsg } from "../utils/bot/messages/sessionSignup";
import { DateTime } from "luxon";
import createAuditLog, { AuditEvent } from "../utils/database/auditLog";


export default {
    data: {
        customId: 'rsvp'
    },
    execute: async (i: ButtonInteraction) => {
        // Vars:
        const {
            // botClient: bot,
            colors: { getOxColor },
            commands: { getLinkString: getCmdLink },
            urls
        } = core;
        const [_, rsvpId, sessionId] = i.customId.split(':');

        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Fetch Session Data:
        const { data: session, error: sessionERR } = await supabase.from('sessions')
            .select('*')
            .eq('id', sessionId)
            .select()
            .single()
        if (!session || sessionERR) throw { message: `Failed to fetch session data for RSVP button interaction!`, details: { session, err: sessionERR } };

        // Get Guild Subscription:
        const subscription = getSubscriptionFromInteraction(i)

        // Get Signup Message:
        const getSignupMsg = async () => {
            if (i.message.id == session.signup_id) return i.message;
            else {
                const channel = await i.guild.channels.fetch(session.channel_id) as TextChannel;
                return await channel?.messages?.fetch(session.signup_id)
            }
        }
        const signupMsg = await getSignupMsg();
        if (!signupMsg) throw { message: 'Failed to fetch Signup Message Panel for RSVP interaction.', details: { session } }

        // IF PAST SESSION - Alert - Update Signup - Return:
        const sessionStart = DateTime.fromISO(session.starts_at_utc);
        if (sessionStart <= DateTime.now()) {
            // Session has already started - RSVP not allowed:
            const alertMsg = new ContainerBuilder({
                accent_color: getOxColor('error'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### ⌛ This session has already occurred!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `According to our records this session has **already started**! \n-# It's possible this signup panel was simply outdated.` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `**Requested Session:** \n> \`${session.title}\` \n**Started At:** \n> <t:${sessionStart.toSeconds()}:f> \n> <t:${sessionStart.toSeconds()}:R> \n-# Feel free to RSVP to another session that's available and hasn't occurred yet!` })
                ]
            })
            if (subscription.limits.SHOW_WATERMARK) {
                alertMsg.components.push(new SeparatorBuilder(), defaultFooterText({ lightFont: true, showHelpLink: true }))
            }
            // Reply to Interaction:
            await i.editReply({
                components: [alertMsg],
                flags: MessageFlags.IsComponentsV2
            })
            // Update Outdated Signup Panel:
            const signupMsgContent = await buildSessionSignupMsg(session, subscription.limits.SHOW_WATERMARK);
            await signupMsg.edit({
                components: [signupMsgContent]
            })
            return;
        }

        // FETCH RSVP Slots & Assignees for Session:
        const [
            { data: rsvpSlots, error: rsvpSlotERR }, // Slots
            { data: rsvpAssignees, error: rsvpAssigneesErr } // Assignees
        ] = await Promise.all([
            await supabase.from('session_rsvp_slots')
                .select('*')
                .eq('session_id', sessionId)
                .select(),
            await supabase.from('session_rsvps')
                .select('*')
                .eq('session_id', sessionId)
        ])
        if (rsvpSlotERR) throw rsvpSlotERR
        if (!rsvpSlots.length) throw { message: `Failed to fetch rsvp slots for session (${sessionId}) for RSVP button interaction!` }
        if (rsvpAssigneesErr) throw rsvpAssigneesErr;
        // Requested Slot:
        const requestedSlot = rsvpSlots.find(s => s.id === `rsvp_${rsvpId}`);
        if (!requestedSlot) throw { message: `Failed to fetch requested rsvp slots from session for RSVP button interaction!`, details: { sessionId, rsvpId: "rsvp_" + rsvpId } }


        // If required role(s) - Perform Checks:
        if (subscription.limits.ALLOW_RSVP_ROLE_RESTRICTION && requestedSlot.roles_required?.length) {
            // Vars:
            const requiredRoles = requestedSlot.roles_required;
            const member = i.member as GuildMember;
            const userRoles = member.roles.cache.map(r => r.id);
            const userAllowed = requiredRoles.every(r => userRoles.includes(r));

            // If NOT ALLOWED - Send Alert - Return:
            if (!userAllowed) {
                const alertMsg = new ContainerBuilder({
                    accent_color: getOxColor('error'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `### 🔒 You're missing a required role!` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `This RSVP slot is protected by one or more required role(s). \n-# You are not assigned at least one of the following roles:` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `\n> <@&${requiredRoles.join('> \n> <@&') + '>'} \n-# Therefore, you cannot be assigned this RSVP!` }),
                    ]
                })
                if (subscription.limits.SHOW_WATERMARK) {
                    alertMsg.components.push(new SeparatorBuilder(), defaultFooterText({ lightFont: true }))
                }
                await i.editReply({
                    components: [alertMsg],
                    flags: MessageFlags.IsComponentsV2
                })
                return;
            }
        }

        // If Already RSVPed to Session - Send Alert - Return:
        const alreadyRSVPedToSession = rsvpAssignees.some(a => a.user_id == i.user.id);
        if (alreadyRSVPedToSession) {
            const currentSlotId = rsvpAssignees.find(a => a.user_id == i.user.id).rsvp_slot_id;
            const currentSlot = rsvpSlots.find(s => s.id == currentSlotId);
            const alertMsg = new ContainerBuilder({
                accent_color: getOxColor('error'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### ⛔ Already RSVPed to this Session!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `According to our records you have **already assigned** yourself to an RSVP slot within this session.` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `**Current RSVP Slot:** \n> \`${currentSlot.title}\`` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `-# Use the ${getCmdLink('my-sessions')} command to modify your current RSVP assignment(s) if you wish to do so.` })
                ]
            })
            if (subscription.limits.SHOW_WATERMARK) {
                alertMsg.components.push(new SeparatorBuilder(), defaultFooterText({ lightFont: true }))
            }
            await i.editReply({
                components: [alertMsg],
                flags: MessageFlags.IsComponentsV2
            })
            return;
        }

        // If Requested Slot at Capacity - Send Alert - Return:
        const currentSlotCapacity = rsvpAssignees.filter(a => a.rsvp_slot_id == requestedSlot.id)?.length ?? 0;
        if (currentSlotCapacity >= requestedSlot.capacity) {
            const alertMsg = new ContainerBuilder({
                accent_color: getOxColor('error'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### ⛔ RSVP Slot at Capacity!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `Unfortunately this RSVP slot has already reached its max user capacity. \n-# Feel free to sign up for another RSVP slot*(if available)* or check back later.` }),
                ]
            })
            if (subscription.limits.SHOW_WATERMARK) {
                alertMsg.components.push(new SeparatorBuilder(), defaultFooterText({ lightFont: true }))
            }
            await i.editReply({
                components: [alertMsg],
                flags: MessageFlags.IsComponentsV2
            })
            return;
        }

        // Checks CLEARED - Assign User to RSVP:
        const { error: dbError } = await supabase.from('session_rsvps').insert({
            rsvp_slot_id: requestedSlot.id,
            session_id: requestedSlot.session_id,
            user_id: i.user.id,
        })
        if (dbError) {
            return await i.editReply({
                components: [
                    genericErrorMsg({ reasonDesc: `A database error has occurred and we were unable to assign you to that RSVP slot. If this issue persists please get in contact with [Bot Support](${urls.support.serverInvite})! \n**Support Details:** \`\`\`GUILD_ID: ${i.guildId} \nRSVP_ID: ${requestedSlot.id}, \nSESSION_ID: ${sessionId}\`\`\` ` })
                ],
                flags: MessageFlags.IsComponentsV2
            })
        }

        // Update - Sessions Signup Panel:
        new Promise(async (res) => {
            const signupMsgContent = await buildSessionSignupMsg(session, subscription.limits.SHOW_WATERMARK);
            await signupMsg.edit({
                components: [signupMsgContent]
            })
        })


        // Success - Build & Send - RSVPed Response:
        const successMsg = new ContainerBuilder({
            accent_color: getOxColor('success'),
            components: <any>[
                new TextDisplayBuilder({ content: `### ✅ RSVP Success!` }),
                // new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `-# View details below:` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `**RSVP Title:** \n> \`${requestedSlot?.title}\` \n**Starts At:** \n> <t:${DateTime.fromISO(session.starts_at_utc)?.toUnixInteger()}:f>` }),
                new SeparatorBuilder(),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            style: ButtonStyle.Secondary,
                            label: '↩ Undo',
                            custom_id: `unRsvp:${rsvpId}:${sessionId}`
                        }),
                        new ButtonBuilder({
                            style: ButtonStyle.Link,
                            label: 'View Session',
                            url: i.message.url
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
            event: AuditEvent.RsvpCreated,
            guild: i.guildId,
            user: i.user.id,
            meta: {
                session_id: session.id,
                rsvp_id: 'rsvp_' + rsvpId
            }
        })

    }
}