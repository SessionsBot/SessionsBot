import { ActionRowBuilder, APIMessageButtonInteractionData, APIMessageComponentButtonInteraction, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, ContainerBuilder, MessageFlags, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { RawMessageButtonInteractionData } from "discord.js/typings/rawDataTypes";
import guildManager from "../utils/database/guildManager";
import sessionsManager from "../utils/database/sessionsManager";
import core from "../utils/core";

export default {
    // Button Definition:
    data: {
        customId: 'OLD-UN-RSVP',
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

        // Attempt to UN-RSVP user to session:
        const tryRSVP = await sessionsManager.sessions.rsvps.remove(guildId, sessionId, dayPathString, userId);
        const rsvpResult = tryRSVP.result

        if(rsvpResult == 'Success'){
            interaction.editReply({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: <any>[
                    new ContainerBuilder({
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
                                        url: `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.interactionMetadata.interactedMessageId}`
                                    })
                                ]
                            }),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `-# Session Id: ${sessionId}`}),
                        ]
                    })
                ]
            })
        } else {
            interaction.editReply({
                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral,
                components: <any>[
                    new ContainerBuilder({
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
                                        url: `https://discord.com/channels/${interaction.guildId}/${interaction.channelId}/${interaction.message.interactionMetadata.interactedMessageId}`
                                    })
                                ]
                            }),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({content: `-# Session Id: ${sessionId}`}),
                        ]
                    })
                ]
            })
        }

    }
}