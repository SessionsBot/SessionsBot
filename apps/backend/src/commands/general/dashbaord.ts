import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ChannelType, CommandInteraction, ComponentType, ContainerBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, PermissionsBitField, SectionBuilder, SeparatorBuilder, SlashCommandBuilder, SlashCommandChannelOption, TextDisplayBuilder } from "discord.js";
import logtail from "../../utils/logs/logtail.js";
import core from "../../utils/core.js";
import { isBotPermissionError, sendPermissionAlert } from "../../utils/bot/permissions/permissionsDenied.js";
import { defaultFooterText } from "../../utils/bot/messages/basic.js";


export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('dashboard')
        .setDescription('Visit your bot dashboard to use and configure Sessions Bot.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    ,
    // Command Execution:
    execute: async (interaction: CommandInteraction) => {
        try {
            // Build Response Msg:
            const responseMsg = new ContainerBuilder({
                accent_color: core.colors.getOxColor('purple'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### 💻 Visit your Bot Dashboard \nClick on the button below to access your bots main dashboard page. This is where you can create and configure your servers sessions/events!` }),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                url: `${core.urls.mainSite}/dashboard`,
                                label: '⚙️ Visit Dashboard'
                            }),
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                url: `${core.urls.docs.root}`,
                                label: '📖 Visit Documentation'
                            })
                        ]
                    }),
                    new SeparatorBuilder(),
                    defaultFooterText({ showHelpLink: true })
                ]
            });

            // Send message:
            await interaction.reply({
                components: [responseMsg],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            });

        } catch (err) {
            // Check for Bot Permission Error:
            if (isBotPermissionError(err)) sendPermissionAlert(interaction.guildId)
            // Log failure
            logtail.warn(`The support command failed during an interaction... see details`, { interaction, err })
        }
    }
}