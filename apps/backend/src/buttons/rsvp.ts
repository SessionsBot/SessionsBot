import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import core from "../utils/core/core";
import { defaultFooterText, genericErrorMsg } from "../utils/bot/messages/basic";
import { DateTime } from "luxon";
import { URLS } from "../utils/core/urls";
import dbManager from "../utils/database/manager";


export default {
    data: {
        customId: 'rsvp'
    },
    execute: async (i: ButtonInteraction) => {
        // Vars:
        const [_, rsvpId, sessionId] = i.customId.split(':');

        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Attempt to Assign User to RSVP:
        const rsvpResult = await dbManager.rsvps.add(i.guildId, sessionId, rsvpId, i.user.id)

        // Get Guild Subscription:
        const guildSubscription = getSubscriptionFromInteraction(i);

        // Get Rsvp Result Data:
        let responseContent: ContainerBuilder = undefined;
        let sessionData = rsvpResult?.sessionData
        const requestedSlot = sessionData?.session_rsvp_slots?.find(s => s.id == rsvpId)
        const panelUrl = `https://discord.com/channels/${i.guildId}/${sessionData?.thread_id ?? sessionData?.channel_id}/${sessionData?.panel_id}`

        // Send Result Response:
        if (!rsvpResult.success) {
            // Failed RSVP:
            let errorType = rsvpResult.error.type

            // RSVP - Errored - Send Alert:
            if (errorType == 'Already RSVPed') {
                // RSVP - Already Assigned - Send Alert:
                const currentSlot = sessionData.session_rsvp_slots.find(s => s.session_rsvps.some(r => r.user_id == i.user.id))
                responseContent = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('user_fail')}  Failed to RSVP` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Reason**: \n> According to our records you are **already RSVPed** within this session! \n**Session Title**: \n> \`${sessionData?.title}\` \n**RSVP Title**: \n> \`${currentSlot?.title}\` \n-# If you wish to modify your current upcoming RSVP assignments use the ${core.commands.getLinkString('my-rsvps')} command.` }),
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
            } else if (errorType == 'At Capacity') {
                // RSVP - At Capacity - Send Alert:
                responseContent = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('user_fail')}  Failed to RSVP - At Capacity` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Reason**: \n> According to our records this RSVP slot **is at capacity** and not allowing anymore users! \n**RSVP Title**: \n> \`${requestedSlot?.title}\` \n**Capacity**: \n> \`${requestedSlot?.session_rsvps?.length ?? 0}/${requestedSlot?.capacity}\`` }),
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
            } else if (errorType == 'Past Session') {
                // RSVP - Past Session - Send Alert:
                const startUtc = DateTime.fromISO(sessionData.starts_at_utc, { zone: 'utc' });
                responseContent = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('clock')}  Failed to RSVP - Past Session` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Reason**: \n> According to our records this session **has already started** and is not allowing anymore RSVPs! \n**Session Title**: \n> \`${sessionData?.title}\` \n**Start Date**: \n> <t:${startUtc.toUnixInteger()}:F> \n> <t:${startUtc.toUnixInteger()}:R> \n-# This signup panel was likely outdated, search for available sessions __in the future__ throughout this server to RSVP!` }),
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
            } else if (errorType == 'Required Roles') {
                // RSVP - Past Session - Send Alert:
                const requiredRoleIds = requestedSlot.roles_required
                responseContent = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('lock')}  Failed to RSVP - Required Roles` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Reason**: \n> Unfortunately, you're missing one *(or more)* of the **required roles to assign yourself** to this RSVP slot. \n**RSVP Title**: \n> \`${requestedSlot?.title}\` \n**Required Role(s)**: \n> - <@&${requiredRoleIds.join(`> - \n<@&`)}>` }),
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
            } else if (errorType == 'Session Canceled') {
                // RSVP - Session Canceled - Send Alert:
                const startUtc = DateTime.fromISO(sessionData.starts_at_utc, { zone: 'utc' });
                responseContent = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('clock')}  Failed to RSVP - Past Session` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Reason**: \n> According to our records this session **has been canceled** and is no longer allowing RSVPs! \n**Session Title**: \n> \`${sessionData?.title}\` \n**Start Date**: \n> <t:${startUtc.toUnixInteger()}:F> \n> <t:${startUtc.toUnixInteger()}:R>` }),
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
                responseContent = genericErrorMsg({
                    title: `${core.emojis.string('warning')}  Failed to RSVP`,
                    reasonDesc: `Unfortunately we hit an internal error when trying to save this RSVP assignment. If this issue persists, please contact [Bot Support](${URLS.support_chat})!`
                })
            }



        } else {
            // RSVP - Succeeded - Send Alert:
            responseContent = new ContainerBuilder({
                accent_color: core.colors.getOxColor('success'),
                components: <any>[
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('user_success')} RSVP Success!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `**RSVP Title:** \n> \`${requestedSlot?.title}\` \n**Starts At:** \n> <t:${DateTime.fromISO(sessionData.starts_at_utc)?.toUnixInteger()}:f>` }),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Secondary,
                                emoji: { name: 'undo', id: core.emojis.ids.undo },
                                label: 'Undo',
                                custom_id: `unRsvp:${rsvpId}:${sessionId}`
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