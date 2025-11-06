import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ContainerBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import guildManager from "../../utils/database/guildManager.js";
import logtail from "../../utils/logs/logtail.js";
import core from "../../utils/core.js";

export default{
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName(`setup`)
        .setDescription(`Get your server started with Sessions Bot! (provides setup link)`)
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild || PermissionFlagsBits.Administrator)
    ,
    // Command Execution:
    execute: async (interaction:CommandInteraction) => {
        // Read Guild Data:
        const guildId = interaction.guildId
        const getGuild = await guildManager.readGuildDoc(guildId)
        const guildData = getGuild.success ? getGuild.data : null
        if(!guildData) throw 'Failed to read guild data for /setup command!';
        const signupChannels = Object.keys(guildData.configuration.signupChannels);

        // Send Setup Message:
        const msg = () => {
            if(signupChannels.length){
                // Likely already setup:
                return new ContainerBuilder({
                    accent_color: core.colors.getOxColor('success'),
                    components: <any>[
                        new TextDisplayBuilder({content: `### 🤔 Hm, It seems this server is already setup!`}),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `> Based on our records it seems this server has **already been configured**! You can visit your [bot dashboard](${core.urls.mainSite + '/dashboard'}) to further modify and adjust schedules and preferences.`}),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: <any>[
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    label: `💻 Bot Dashboard`,
                                    url: (core.urls.mainSite + '/dashboard')
                                })
                            ]
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `-# TIP: You can disable this command as it's no longer needed.`}),
                    ]
                })
            } else {
                // Likely not setup:
                return new ContainerBuilder({
                    accent_color: core.colors.getOxColor('purple'),
                    components: <any>[
                        new TextDisplayBuilder({content: `### 🥳 Lets get \`${interaction.guild.name}\` started with Sessions Bot!`}),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `> Click on the setup link below to begin the initial setup process for your bot. This will walk you through the setup for <@${core.botClient.user.id}> from our web dashboard.`}),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: <any>[
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    label: `💻 Bot Dashboard`,
                                    url: (core.urls.mainSite + '/dashboard')
                                })
                            ]
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({content: `-# TIP: This is the same link from the bot's first join message. You can also disable this command as it's no longer needed after setup is complete.`})
                    ]
                })
            }
        }

        // Reply to Command:
        await interaction.reply({
            components: [msg()],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        })
    }
}