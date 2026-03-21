import { ButtonStyle, ComponentType, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import core from "../core/core";
import { URLS } from "../core/urls";
import { DateTime } from "luxon";
import { useLogger } from "../logs/logtail";
import sendWithFallback from "../bot/messages/sendWithFallback";
import { MigratingTemplates_DeletionDate } from "@sessionsbot/shared";

const createLog = useLogger()


export const upgradeStartingMessage = (ownerId: string) => new ContainerBuilder({
    accent_color: core.colors.getOxColor('purple'),
    components: <any>[
        new TextDisplayBuilder({ content: `## ${core.emojis.string('logo_text')} Upgrading to Sessions Bot \`V2\`! \n> Your bot is getting a **major update**! Make sure to read important details below:` }),
        new SeparatorBuilder(),
        new SectionBuilder({
            components: <any>[
                new TextDisplayBuilder({ content: `${core.emojis.string('down')}  **Temporary Downtime**: \n> As we begin to publish the new changes to Sessions Bot our internal system and discord bot **will be briefly unavailable**. You can keep track of updates regrading this on our status page!` })
            ],
            accessory: {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: URLS.status_page,
                emoji: { id: core.emojis.ids.globe },
                label: 'View Status Page'
            }
        }),
        new SeparatorBuilder(),
        new SectionBuilder({
            components: <any>[
                new TextDisplayBuilder({ content: `${core.emojis.string('help')}  **Questions/Concerns?**: \n> Our **support team is available** to assist you! Join our community server and open a support ticket or check out these other [useful resources](${URLS.site_links.support}).` })
            ],
            accessory: {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: URLS.support_chat,
                emoji: { id: core.emojis.ids.chat },
                label: 'Support Chat'
            }
        }),
        new SeparatorBuilder(),
        new TextDisplayBuilder({ content: `-# Thanks for using <@${core.botClient.user.id}>'s Pre-Release Version 💜!  --  @here <@${ownerId}>` })
    ]
})


export const upgradeCompleteMessage = (ownerId: string) => new ContainerBuilder({
    accent_color: core.colors.getOxColor('purple'),
    components: <any>[
        new TextDisplayBuilder({ content: `## 🎉 Upgraded to Sessions Bot \`V2\`! \n> Your bot's **update** has finally arrived! Make sure to read important details below:` }),
        new SeparatorBuilder(),
        new SectionBuilder({
            components: <any>[
                new TextDisplayBuilder({ content: `${core.emojis.string('star')}  **New Features**: \n> Congrats! Your bot just got **way more amazing**! Visit your all **NEW Bot Dashboard** to take advantage of exciting features like: \n> - Custom Session Repeat Intervals (daily, weekly, monthly, yearly) \n> - Customizable Session (Signup) Panels (using Discord Markdown!) \n> - Native Discord Event Integration \n> - Online Session/Event Viewing \n> - And so much more!` })
            ],
            accessory: {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: URLS.site_links.dashboard,
                emoji: { id: core.emojis.ids.dashboard },
                label: 'Open Dashboard'
            }
        }),
        new SeparatorBuilder(),
        new SectionBuilder({
            components: <any>[
                new TextDisplayBuilder({ content: `${core.emojis.string('right')}  **Migrating Previous Schedules**: \n> By default, your previously configured session schedules **WILL NOT be enabled**! However, you can easily __re-enable your past schedules by visiting you new [bot dashboard](${URLS.site_links.dashboard})__. \n> -- \n> -# **NOTE**: Your "previous" schedules will be available to "migrate over" for the next 30 days! *(Deletes on: <t:${MigratingTemplates_DeletionDate.startOf('day').toUnixInteger()}:d>)* ` }),
            ],
            accessory: {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: URLS.site_links.dashboard,
                emoji: { id: core.emojis.ids.success },
                label: 'Confirm Schedules'
            }
        }),
        new SeparatorBuilder(),
        new SectionBuilder({
            components: <any>[
                new TextDisplayBuilder({ content: `${core.emojis.string('help')}  **Questions/Concerns?**: \n> Our **support team is available** to assist you! Join our community server and open a support ticket or check out these other [useful resources](${URLS.site_links.support}).` })
            ],
            accessory: {
                type: ComponentType.Button,
                style: ButtonStyle.Link,
                url: URLS.support_chat,
                emoji: { id: core.emojis.ids.chat },
                label: 'Support Chat'
            }
        }),
        new SeparatorBuilder(),
        new TextDisplayBuilder({ content: `-# Thanks for using <@${core.botClient.user.id}> 💜!  --  @here <@${ownerId}>` })
    ]
})


export async function sendUpgradeAlert(alert: 'start' | 'completed', guildId: string) {

    try {
        // Fetch Guild:
        const guild = await core.botClient.guilds.fetch(guildId)
        if (!guild) {
            // Log & Return - Missing/Not Found Guild:
            createLog.for('Bot').error(`Failed to migrate a guild -- NOT FOUND! -- Guild: ${guildId}`, { guildId })
            return {
                success: false,
                error: true,
                type: 'Missing Guild'
            } as const
        }
        // Fetch Guild Owner (DM):
        const guildOwner = await core.botClient.users.fetch(guild?.ownerId)
        if (!guildOwner) createLog.for('Bot').warn('Failed to fetch a guild owner! - Wont DM about migration upgrades...', { guildId, userId: guild?.ownerId })

        // Message Content:
        let msg: ContainerBuilder = null
        if (alert == 'start') {
            msg = upgradeStartingMessage(guildOwner?.id)
        }
        if (alert == 'completed') {
            msg = upgradeCompleteMessage(guildOwner?.id)
        }
        if (!msg) return {
            success: false,
            error: true,
            type: 'No Message to Send'
        } as const

        // Send to Guild:
        await sendWithFallback(guildId, msg)

        // Send to Owner DM:
        try {
            const dmChannel = guildOwner
                ? (await guildOwner.dmChannel?.fetch())?.isSendable()
                    ? guildOwner?.dmChannel
                    : await guildOwner?.createDM(true)
                : null;
            await dmChannel.send({
                components: [msg],
                flags: MessageFlags.IsComponentsV2
            })
        } catch (error) {
            createLog.for('Bot').warn(`CANNOT DM USER! - Bot Migration/Update Alerts (UserId: ${guild?.ownerId})`, { guildId, userId: guild?.ownerId })
        }

        // Return Success
        return {
            success: true
        } as const


    } catch (err) {
        // Log & Return Error:
        createLog.for('Bot').error(`FAILED! - Alerting User/Guild of Bot Migration Updates!`, { err, guildId })
        return {
            success: false,
            error: err,
            type: 'Internal'
        } as const
    }


}