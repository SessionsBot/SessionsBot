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
        .setName('dashboard')
        .setDescription('Visit your bot dashboard to use and configure Sessions Bot.')
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
                    new TextDisplayBuilder({ content: `### ${core.emojis.string('link')}  Visit your Bot Dashboard \n> This is where you can create and **configure your server's sessions/events** and more! \n> -# Use ${core.commands.getLinkString('support')} for help!` }),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                url: `${URLS.site_links.dashboard}`,
                                emoji: { name: 'dashboard', id: core.emojis.ids.dashboard },
                                label: 'Visit Dashboard'
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
            createLog.for('Bot').warn(`The /dashboard command failed during an interaction... see details`, {
                interaction: {
                    user: i.user.id,
                    interactionId: i.id,
                    guildId: i.guildId,
                }, err
            });
        }
    }
}