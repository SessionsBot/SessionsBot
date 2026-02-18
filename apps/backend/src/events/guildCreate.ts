import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, Events, Guild, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { useLogger } from "../utils/logs/logtail";
import core from "../utils/core";
import sendWithFallback from "../utils/bot/messages/sendWithFallback";
import discordLog from "../utils/logs/discord";
import dbManager from "../utils/database/manager";
import { createAuditLog } from "../utils/database/auditLog";
import { defaultFooterText } from "../utils/bot/messages/basic";
import { AuditEvent } from "@sessionsbot/shared";

const createLog = useLogger();



/** Event - New guild added Sessions Bot */
export default {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        // Log new guild added:
        createLog.for('Guilds').info(`➕ GUILD ADDED - ${guild.name} - ${guild.id}`);
        discordLog.events.guildAdded(guild);
        createAuditLog({
            event: AuditEvent.BotAdded,
            guild: guild.id,
            user: core.botClient?.user?.id || null,
            meta: undefined
        })

        // Add Guild to database:
        const result = await dbManager.guilds.add(guild);
        if (!result.success) {
            return createLog.for('Database').error('Failed to save/create - New Guild - SEE DETAILS', { result })
        }

        // Build/Send Welcome Message:
        const welcomeMsg = new ContainerBuilder({
            accent_color: core.colors.getOxColor('purple'),
            components: <any>[
                new TextDisplayBuilder({ content: `## ${core.emojiStrings?.logo} Welcome to Sessions Bot! \n-# Thank you for installing our application, we hope you enjoy it!` }),
                new SeparatorBuilder(),
                new SectionBuilder({
                    components: <any>[
                        new TextDisplayBuilder({ content: `**Learn all about Sessions Bot:** \n-# Read throughout our documentation website to familiarize yourself with Sessions Bot and it's features.` })
                    ],
                    accessory: {
                        type: ComponentType.Button,
                        url: core.urls.docs.root,
                        style: ButtonStyle.Link,
                        label: '📃 Documentation'
                    }
                }),
                new SectionBuilder({
                    components: <any>[
                        new TextDisplayBuilder({ content: `**Consider Upgrading:** \n-# Sessions Bot comes with lots of free features! If you ever wish to expand capabilities, check out our shop for available upgrades.` })
                    ],
                    accessory: {
                        type: ComponentType.Button,
                        url: `https://discord.com/application-directory/${core.botClient.application.id}/store`,
                        style: ButtonStyle.Link,
                        label: '🛍️ Shop',

                    }
                }),
                new SectionBuilder({
                    components: <any>[
                        new TextDisplayBuilder({ content: `**Need Help? Get Support!** \n-# View our [support center](${core.urls.support.onlineResources}) via our website or click the interaction button for an invite to our Discord Support Chat.` })
                    ],
                    accessory: {
                        type: ComponentType.Button,
                        url: core.urls.support.serverInvite,
                        style: ButtonStyle.Link,
                        label: '💬 Support Chat'
                    }
                }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `### ✅ Ready to Get Started? \n **View your [Bot Dashboard](https://sessionsbot.fyi/dashboard) via our web app** to get started creating your first sessions. 😊` }),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            label: `💻 View Dashboard`,
                            url: 'https://sessionsbot.fyi/dashboard',
                            style: ButtonStyle.Link
                        })
                    ]
                }),
                new SeparatorBuilder(),
                defaultFooterText({ appendText: `| @here` })
            ]
        })
        const send = await sendWithFallback(guild.id, welcomeMsg);
        if (!send.success) {
            createLog.for('Bot').warn(`Failed to send "Welcome Message" for new guild! - ${guild.id}`, { sendResult: send });
        }
    }
}