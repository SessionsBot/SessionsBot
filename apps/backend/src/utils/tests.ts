import core from "./core/core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import discordLog from "./logs/discord.js";
import { initTemplateCreationScheduler } from "./database/schedules/templatesSchedule.js";
import sendWithFallback from "./bot/messages/sendWithFallback.js";
import { defaultFooterText } from "./bot/messages/basic.js";
import { ButtonBuilder, ButtonStyle, ComponentType, SeparatorBuilder, ActionRowBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder } from "discord.js";
import { URLS } from "./core/urls.js";


const createLog = useLogger();
const guildId = process.env["GUILD_ID_DEVELOPMENT"];
const channelId = '1430465764619714590'


export default {
    /** Runs on bot startup in DEVELOPMENT environments only. */
    init: async () => {
        try {
            if (ENVIRONMENT_TYPE == 'development') {
                console.info('--- \n[i] Running Development Tests!');
                const { botClient: bot, colors } = core
                // Test here..\


                // Build/Send Welcome Message:
                const welcomeMsg = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('purple'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `# ${core.emojis.string('logo')} Welcome to Sessions Bot! \n-# Thank you for installing our application, we hope you enjoy it!` }),
                        new SeparatorBuilder(),
                        new SectionBuilder({
                            components: <any>[
                                new TextDisplayBuilder({ content: `**Learn all about Sessions Bot:** \n-# Read throughout our documentation website to familiarize yourself with Sessions Bot and it's features.` })
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                url: URLS.documentation,
                                style: ButtonStyle.Link,
                                emoji: { name: 'list', id: core.emojis.ids.list },
                                label: 'Documentation'
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
                                emoji: { name: 'premium', id: core.emojis.ids.premium },
                                label: 'Shop',

                            }
                        }),
                        new SectionBuilder({
                            components: <any>[
                                new TextDisplayBuilder({ content: `**Need Help? Get Support!** \n-# View our [support center](${URLS.site_links.support}) via our website or click the interaction button for an invite to our Discord Support Chat.` })
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                url: URLS.support_chat,
                                style: ButtonStyle.Link,
                                emoji: { name: 'chat', id: core.emojis.ids.chat },
                                label: 'Support Chat'
                            }
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `### ${core.emojis.string('star')} Ready to Get Started? \n> **View your [Bot Dashboard](https://sessionsbot.fyi/dashboard) via our web app** to get started creating your first sessions. 😊` }),
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({
                                    emoji: { name: 'dashboard', id: core.emojis.ids.dashboard },
                                    label: `View Dashboard`,
                                    url: 'https://sessionsbot.fyi/dashboard',
                                    style: ButtonStyle.Link
                                })
                            ]
                        }),
                        new SeparatorBuilder(),
                        defaultFooterText({ appendText: `| @here` })
                    ]
                })
                const send = await sendWithFallback(guildId, welcomeMsg);


                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}