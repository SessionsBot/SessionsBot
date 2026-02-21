import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ContainerBuilder, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import { useLogger } from "../../utils/logs/logtail.js";
import core from "../../utils/core/core.js";
import { isBotPermissionError, sendPermissionAlert } from "../../utils/bot/permissions/permissionsDenied.js";
import { defaultFooterText } from "../../utils/bot/messages/basic.js";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import { URLS } from "../../utils/core/urls.js";

const createLog = useLogger();

export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('documentation')
        .setDescription('Learn all about Sessions Bot from this detailed application guide/user manual.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    ,
    // Command Execution:
    execute: async (i: CommandInteraction) => {
        try {
            // Get Guild Subscription
            const subscription = getSubscriptionFromInteraction(i)

            // Build Response Msg:
            const responseMsg = new ContainerBuilder({
                accent_color: core.colors.getOxColor('purple'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### ${core.emojis.string('link')}  Read the Bot Documentation \n> This is a great resource to **learn about Sessions Bot** and how to use it's core features! \n> -# **Experiencing Issues?** Use ${core.commands.getLinkString('support')} for help!` }),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                url: `${URLS.documentation}`,
                                emoji: { name: 'list', id: core.emojis.ids.list },
                                label: 'View Documentation'
                            }),
                        ]
                    }),

                ]
            });

            // IF FREE PLAN - Show Watermark:
            if (subscription.limits.SHOW_WATERMARK) {
                responseMsg.components.push(
                    new SeparatorBuilder(),
                    defaultFooterText({ showHelpLink: true })
                )
            }

            // Send message:
            await i.reply({
                components: [responseMsg],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            });

        } catch (err) {
            // Check for Bot Permission Error:
            if (isBotPermissionError(err)) sendPermissionAlert(i.guildId)
            // Log failure
            createLog.for('Bot').warn(`The /documentation command failed during an interaction... see details`, {
                interaction: {
                    user: i.user.id,
                    interactionId: i.id,
                    guildId: i.guildId,
                }, err
            });
        }
    }
}