import { ButtonStyle, CommandInteraction, ComponentType, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import { useLogger } from "../../utils/logs/logtail.js";
import core from "../../utils/core/core.js";
import { isBotPermissionError, sendPermissionAlert } from "../../utils/bot/permissions/permissionsDenied.js";
import { getSubscriptionFromInteraction, SubscriptionLevel, SubscriptionSKUs } from "@sessionsbot/shared";
import { defaultFooterText } from "../../utils/bot/messages/basic.js";
import { URLS } from "../../utils/core/urls.js";

const createLog = useLogger()

export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('support')
        .setDescription('Need help with Sessions Bot? Use this command for support resources.')
    ,
    // Command Execution:
    execute: async (i: CommandInteraction) => {
        try {
            // Get Guild Subscription:
            const subscription = getSubscriptionFromInteraction(i)

            // Build Default Response Msg:
            const responseMsg = new ContainerBuilder({
                accent_color: core.colors.getOxColor('warning'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### 🤔 Need Help with Sessions Bot?\ \n-# Don't worry theres plenty of support resources to get your sessions running smoothly!` }),
                    new SeparatorBuilder(),
                    new SectionBuilder({
                        components: <any>[
                            new TextDisplayBuilder({ content: `**Join our Support Server** \n-# Get instant support, access information, get update announcements, and more!` })
                        ],
                        accessory: {
                            label: 'Support Chat',
                            emoji: { name: '💬' },
                            style: ButtonStyle.Link,
                            url: URLS.support_chat,
                            type: ComponentType.Button
                        }
                    }),
                    new SectionBuilder({
                        components: <any>[
                            new TextDisplayBuilder({ content: `**Read the Bot Documentation** \n-# Learn everything there is to know about Sessions Bot in this online guide!` })
                        ],
                        accessory: {
                            label: 'Read Docs',
                            emoji: { name: '📃' },
                            style: ButtonStyle.Link,
                            url: URLS.documentation,
                            type: ComponentType.Button
                        }
                    }),
                    new SectionBuilder({
                        components: <any>[
                            new TextDisplayBuilder({ content: `**More Resources** \n-# Status page, recent incidents, FAQs, support email, and more!` })
                        ],
                        accessory: {
                            label: 'More Resources',
                            emoji: { name: '🗂️' },
                            style: ButtonStyle.Link,
                            url: URLS.site_links.support,
                            type: ComponentType.Button
                        }
                    }),

                ]
            });

            // Free Plan - Add Watermark:
            if (subscription.limits.SHOW_WATERMARK) {
                responseMsg.components.push(
                    new SeparatorBuilder(),
                    defaultFooterText()
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
            createLog.for('Bot').warn(`The /support command failed during an interaction... see details`, {
                interaction: {
                    user: i.user.id,
                    guild: i.guildId,
                    interaction: i.id
                }, err
            });
        }
    }
}