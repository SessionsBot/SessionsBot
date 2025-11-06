import { ActionRowBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import sessionsManager from "../utils/database/sessionsManager";
import core from "../utils/core";

export default {
    // Button Definition:
    data: {
        customId: 'RSVP',
    },
    // Button Execution:
    execute: async (interaction:ButtonInteraction) => {
        // Defer Reply
        await interaction.deferReply({
            flags: MessageFlags.Ephemeral
        })
        
        // Parse interaction data:
        const userId = interaction.user.id;
        const guildId = interaction.guildId;
        const [, dayPathString, sessionId, rsvpId] = interaction.customId.split(':');

        // Attempt to RSVP user to session:
        const tryRSVP = await sessionsManager.sessions.rsvps.add(guildId, sessionId, dayPathString, rsvpId, userId)
        const rsvpResult = tryRSVP.result

        if(rsvpResult == 'Success'){
            // User has RSVPed - Get & Send Response:
            const sessionData = tryRSVP.data.staleSessionData;
            const roleData = sessionData.rsvps[rsvpId];
            const sessionMsgLink = interaction.message.url
            const RSVPedMsgBuild = new ContainerBuilder({
                accent_color: core.colors.getOxColor('success'),
                components: <any>[
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `### ✅ Success - RSVP`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `**Session:** \n> ${sessionData.title} \n**Starts at:** \n> <t:${sessionData.startsAt.discordTimestamp}:t> \n**RSVP Role:** \n> ${roleData.emoji} ${roleData.name}`}),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Secondary,
                                label: `↩ Undo`,
                                custom_id: `UN-RSVP:${dayPathString}:${sessionId}:${rsvpId}`
                            }),
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                label: '💻 View Online',
                                url: `${core.urls.mainSite}/sessions/${guildId}/${sessionData.startsAt.discordTimestamp}`
                            })
                        ]
                    }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `-# <@${userId}> | [👁](${sessionMsgLink})`})
                ]
            })

            // Edit/Send Response:
            const RSVPedMsg = await interaction.editReply({
                components: [RSVPedMsgBuild],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            });

            // Await/Collect Interactions: (undo rsvp)
            const reply = await interaction.fetchReply();
            const undoCollector = reply.createMessageComponentCollector({
                componentType: ComponentType.Button,
                filter: (i) => i.customId.startsWith('UN-RSVP'),
                idle: 60_000
            })

            undoCollector.on('collect', async (unRsvpInteraction) => {
                // On 'Undo' Click - Defer Reply:
                unRsvpInteraction.deferUpdate().catch(()=>{});
                const [, dayPathString, sessionId, rsvpId] = unRsvpInteraction.customId.split(':')
                // Undo RSVP:
                const undoRsvpAttempt = await sessionsManager.sessions.rsvps.remove(guildId, sessionId, dayPathString, userId);
                const undoResult = undoRsvpAttempt.result;
                
                // Get new msg contents:
                const undoResultMsgBuild = () => {

                    if(undoResult == 'Success')
                    return new ContainerBuilder({
                        accent_color: core.colors.getOxColor('success'),
                        components: <any>[
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `### ✅ Success - Un-RSVP`}),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `**Details:** \n> You have successfully removed yourself as an RSVP from this session!`}),
                            new SeparatorBuilder(),
                            new ActionRowBuilder({
                                components: [
                                    new ButtonBuilder({
                                        style: ButtonStyle.Link,
                                        label: '👁 View Session',
                                        url: interaction.message.url
                                    })
                                ]
                            }),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `-# Session Id: ${sessionId}`}),
                        ]
                    })
                    else // Failed to Undo RSVP Msg:
                    return new ContainerBuilder({
                        accent_color: core.colors.getOxColor('error'),
                        components: <any>[
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `### ❌ Failed - Un-RSVP`}),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `**Details:** \n> We were unable to remove you as an RSVP for the following reason: \n> \`${rsvpResult}\` \n\nTip: *If you believe this is an error please contact support.*`}),
                            new SeparatorBuilder(),
                            new ActionRowBuilder({
                                components: [
                                    new ButtonBuilder({
                                        style: ButtonStyle.Link,
                                        label: '💬 Get Support',
                                        url: core.urls.support.serverInvite
                                    }),
                                    new ButtonBuilder({
                                        style: ButtonStyle.Link,
                                        label: '👁 View Session',
                                        url: interaction.message.url
                                    })
                                ]
                            }),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `-# Session Id: ${sessionId}`}),
                        ]
                    })

                }
                
                // Update Msg:
                await interaction.editReply({
                    components: [undoResultMsgBuild()],
                    flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                });
                
            })

            // On timeout:
            undoCollector.on('end', async () => {
                await interaction.deleteReply().catch((e) => {});
            })

        } else {
            // User failed to RSVP - Get & Send Response:
            const failedRSVPMsg = new ContainerBuilder({
                accent_color: core.colors.getOxColor('error'),
                components: <any>[
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `### ❌ - Couldn't RSVP`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `**Reason:** \n> ${rsvpResult}`}),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                label: '💬 Get Support',
                                url: core.urls.support.serverInvite
                            }),
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                label: '👀 View Session',
                                url: interaction.message.url
                            })
                        ]
                    }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `-# Session Id: ${sessionId} | <@${userId}>`}),
                ]
            })

            await interaction.editReply({
                components: [failedRSVPMsg],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            });


        }

    }
}