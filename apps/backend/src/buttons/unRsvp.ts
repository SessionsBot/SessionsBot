import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, TextChannel, TextDisplayBuilder } from "discord.js";
import { getSubscriptionFromInteraction, AuditEvent } from "@sessionsbot/shared";
import core from "../utils/core/core";
import { defaultFooterText, genericErrorMsg } from "../utils/bot/messages/basic";
import { DateTime } from "luxon";
import dbManager from "../utils/database/manager";
import { URLS } from "../utils/core/urls";

export default {
    data: {
        customId: 'unRsvp'
    },
    execute: async (i: ButtonInteraction) => {
        // Vars:
        const [_, rsvpId, sessionId] = i.customId.split(':');

        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Attempt to Remove User from RSVP:
        const rsvpResult = await dbManager.rsvps.remove(i.guildId, sessionId, rsvpId, i.user.id)

        // Get Guild Subscription:
        const guildSubscription = getSubscriptionFromInteraction(i);

        // Get Rsvp Result Data:
        let responseContent: ContainerBuilder = undefined;
        let sessionData = rsvpResult?.sessionData
        const requestedSlot = sessionData?.session_rsvp_slots?.find(s => s.id == rsvpId)
        const panelUrl = `https://discord.com/channels/${i.guildId}/${sessionData?.thread_id ?? sessionData?.channel_id}/${sessionData?.panel_id}`

        // Send Result Response:
        if (!rsvpResult.success) {
            // Failed UN-RSVP:
            let errorType = rsvpResult.error.type

            if (errorType == 'Not RSVPed') {
                // RSVP - Not Assigned - Send Alert:
                responseContent = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('user_fail')}  Failed to Remove RSVP` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Reason**: \n> You are **NOT assigned as an RSVP** within this session! Therefore we cannot remove you as one... \n**Session Title**: \n> \`${sessionData?.title}\` \n**Help**: \n> Use the ${core.commands.getLinkString('my-rsvps')} command to view your currently assigned RSVP slots.\n-# Experiencing issues? Chat with [Bot Support](${URLS.support_chat})!` }),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    url: panelUrl,
                                    emoji: { name: 'eye', id: core.emojis.ids.eye },
                                    label: 'View Session'
                                })
                            ]
                        })
                    ]

                })
            } else if (errorType == 'Internal' || errorType == 'Unknown' || errorType) {
                // RSVP - At Capacity - Send Alert:
                responseContent = responseContent = genericErrorMsg({
                    title: `${core.emojis.string('warning')}  Failed to Remove RSVP`,
                    reasonDesc: `Unfortunately we hit an internal error when trying to remove this RSVP assignment. If this issue persists, please contact [Bot Support](${URLS.support_chat})!`
                })
            }
        } else {
            // Succeeded - UN-RSVP:
            responseContent = new ContainerBuilder({
                accent_color: core.colors.getOxColor('error'),
                components: <any>[
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('user_fail')} RSVP Removed!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `**RSVP Title:** \n> \`${requestedSlot?.title}\` \n**Session Title:** \n> \`${sessionData?.title}\` \n**Starts At:** \n> <t:${DateTime.fromISO(sessionData.starts_at_utc)?.toUnixInteger()}:f>` }),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Secondary,
                                emoji: { name: 'undo', id: core.emojis.ids.undo },
                                label: 'Undo',
                                custom_id: `rsvp:${rsvpId}:${sessionId}`
                            }),
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                emoji: { name: 'eye', id: core.emojis.ids.eye },
                                label: 'View Session',
                                url: panelUrl
                            })
                        ]
                    })
                ]
            })
        }


        // If SHOW WATERMARK - Add to Response:
        if (guildSubscription.limits.SHOW_WATERMARK) {
            responseContent.components.push(defaultFooterText({ showHelpLink: true }))
        }

        return await i.editReply({
            components: [responseContent],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        })

    }
}