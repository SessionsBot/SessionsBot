import { ActionRowBuilder, ButtonBuilder, ButtonStyle, CommandInteraction, ContainerBuilder, InteractionContextType, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, TextDisplayBuilder } from "discord.js";
import core from "../../utils/core/core";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import { defaultFooterText } from "../../utils/bot/messages/basic";
import { URLS } from "../../utils/core/urls";

export default {
    // Command Definition
    data: new SlashCommandBuilder()
        .setName('new-session')
        .setDescription('Create a new session/event for Sessions Bot to manage.')
        .setContexts(InteractionContextType.Guild)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild || PermissionFlagsBits.Administrator)
    ,
    execute: async (i: CommandInteraction) => {
        // Get subscription:
        const subscription = getSubscriptionFromInteraction(i)
        // Create response msg:
        const rsp = new ContainerBuilder({
            accent_color: core.colors.getOxColor('success'),
            components: <any>[
                new TextDisplayBuilder({ content: `## 🆕 New Session` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `-# Click on the link button attached to this message to begin create a new session/event for this Discord Server through Sessions Bot!` }),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            style: ButtonStyle.Link,
                            url: URLS.site_links.dashboard + `?guild=${i.guildId}&action=new+session`,
                            label: `Create Session`
                        })
                    ]
                })
            ]
        })
        // Add watermark - if needed
        if (subscription.limits.SHOW_WATERMARK) {
            rsp.components.push(defaultFooterText({ lightFont: true, showHelpLink: true }))
        }
        // Send Response:
        await i.reply({
            components: [rsp],
            flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
        })
    }
}