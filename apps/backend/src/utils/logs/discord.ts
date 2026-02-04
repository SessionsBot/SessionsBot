import { ContainerBuilder, Entitlement, Guild, MediaGalleryBuilder, MessageFlags, SeparatorBuilder, SKU, TextChannel, TextDisplayBuilder } from 'discord.js';
import core from '../core.js'
import { useLogger } from './logtail.js'
import { DateTime } from 'luxon';
import { ENVIRONMENT_TYPE } from '../environment.js';

const createLog = useLogger();

const logGuildId = ENVIRONMENT_TYPE == 'production'
    ? process.env?.['GUILD_ID_PUBLIC']
    : process.env?.['GUILD_ID_DEVELOPMENT'];

const logChannels = {
    guild_join_leave: ENVIRONMENT_TYPE == 'production'
        ? '1424195270618644655'
        : '1462313668678258739',
    entitlement_updates: ENVIRONMENT_TYPE == 'production'
        ? '1425618618539835432'
        : '1462313734847598747',
};


const defaultGuildIcon = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/198142ac-f410-423a-bf0b-34c9cb5d9609/dbtif5j-60306864-d6b7-44b6-a9ff-65e8adcfb911.png/v1/fit/w_128,h_128,q_70,strp/discord_metro_icon_by_destuert_dbtif5j-375w-2x.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NTEyIiwicGF0aCI6Ii9mLzE5ODE0MmFjLWY0MTAtNDIzYS1iZjBiLTM0YzljYjVkOTYwOS9kYnRpZjVqLTYwMzA2ODY0LWQ2YjctNDRiNi1hOWZmLTY1ZThhZGNmYjkxMS5wbmciLCJ3aWR0aCI6Ijw9NTEyIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.1Fi0jR0YCIK_seYmEuy6R_LyBrJM4K6HOPXAtsf-3yQ';


// Util - Send Log Message to Log Channel:
async function sendLogMessage(msg: ContainerBuilder, channel: string) {
    try {
        // Fetch Log Channel
        const logGuild = await core.botClient.guilds.fetch(logGuildId);
        if (!logGuild) throw `Failed to fetch guild for logging event`
        const logChannel = await logGuild.channels.fetch(channel)
        if (!logChannel || !logChannel.isSendable()) throw `Failed to fetch channel for logging event`

        // Send Log Msg
        await logChannel.send({
            components: [msg],
            flags: MessageFlags.IsComponentsV2
        })

        return { success: true, details: undefined }
    } catch (err) {
        return { success: false, details: err }
    }
}


/** Logging methods to internal Discord Server! */
export default {

    /** Log a specific event occurrence to logs. */
    events: {

        /** Logs a guild that had just added Sessions Bot */
        guildAdded: async (addedGuild: Guild) => {
            try {

                // Convert Timestamp
                const createdAt = Math.floor(DateTime.fromMillis(addedGuild?.createdTimestamp).toSeconds());
                const joinedAt = Math.floor(DateTime.fromMillis(addedGuild?.joinedTimestamp).toSeconds());

                // Build 'Event Message'
                const msgContainer = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('success'),
                    components: <any>[
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `## ✅ Bot Added to Server` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `### Name: \n> ${addedGuild?.name}` }),
                        new TextDisplayBuilder({ content: `### Created at: \n> <t:${createdAt}:F>` }),
                        new TextDisplayBuilder({ content: `### Joined at: \n> <t:${joinedAt}:F>` }),
                        new TextDisplayBuilder({ content: `### Member Count: \n> ${addedGuild?.memberCount}` }),
                        new TextDisplayBuilder({ content: `### Guild Icon:` }),
                        new MediaGalleryBuilder({
                            items: [
                                {
                                    description: 'Guild Icon',
                                    media: { url: addedGuild?.iconURL() || defaultGuildIcon }
                                }
                            ]
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `-# Guild Id: ${addedGuild?.id}` }),
                        new SeparatorBuilder(),


                    ]
                })

                // Send Log Msg
                const send = await sendLogMessage(msgContainer, logChannels.guild_join_leave)
                if (!send.success) throw send;

            } catch (err) { // Error Occurred
                createLog.for('Bot').warn(`Failed to post event "Guild Added" to internal Discord Log.`, { err })
            }
        },


        /** Logs a guild that had just removed Sessions Bot */
        guildRemoved: async (guildRemoved: Guild, templatesCreated?: number) => {
            try {

                // Convert Timestamps
                const joinedAt = Math.floor(DateTime.fromMillis(guildRemoved?.joinedTimestamp).toSeconds());
                const leftAt = Math.floor(DateTime.now().toSeconds());

                // Build 'Event Message'
                const msgContainer = new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `## ❌ Bot Removed from Server` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `### Name: \n> ${guildRemoved?.name}` }),
                        new TextDisplayBuilder({ content: `### Joined at: \n> <t:${joinedAt}:F>` }),
                        new TextDisplayBuilder({ content: `### Left at: \n> <t:${leftAt}:F>` }),
                        new TextDisplayBuilder({ content: `### Templates Created: \n> ${templatesCreated ?? '`Unknown`'}` }),
                        new TextDisplayBuilder({ content: `### Member Count: \n> ${guildRemoved?.memberCount}` }),
                        new TextDisplayBuilder({ content: `### Guild Icon:` }),
                        new MediaGalleryBuilder({
                            items: [
                                {
                                    description: 'Guild Icon',
                                    media: { url: guildRemoved?.iconURL() || defaultGuildIcon }
                                }
                            ]
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `-# Guild Id: ${guildRemoved?.id}` }),
                        new SeparatorBuilder(),


                    ]
                })


                // Send Log Msg
                const send = await sendLogMessage(msgContainer, logChannels.guild_join_leave)
                if (!send.success) throw send;

            } catch (err) { // Error Occurred
                createLog.for('Bot').warn(`Failed to post event "Guild Removed" to internal Discord Log.`, { err })
            }
        },


        /** Logs an entitlement after its initial creation. */
        entitlementCreated: async (entitlement: Entitlement) => {
            try {
                const { botClient: bot, storeSKUs, colors: { getOxColor } } = core;
                const skuInfo: Partial<SKU> = storeSKUs[entitlement.skuId] || null;
                const owner = entitlement.isGuildSubscription()
                    ? await bot.guilds.fetch(entitlement.guildId)
                    : null;

                // Build 'Event Message'
                const msgContainer = new ContainerBuilder({
                    accent_color: getOxColor('success'),
                    components: <any>[
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `## 🛍️ Entitlement Created` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `### Product Name: \n> ${skuInfo?.name}` }),
                        new TextDisplayBuilder({ content: `### Guild Name: \n> ${owner?.name}` }),
                        new TextDisplayBuilder({ content: `### Guild Id: \n> ${owner?.id}` }),
                        new TextDisplayBuilder({ content: `### SKU Id: \n> ${entitlement?.skuId}` }),
                        new TextDisplayBuilder({ content: `### Entitlement Id: \n> ${entitlement?.id}` }),
                        new MediaGalleryBuilder({
                            items: [
                                {
                                    description: 'Guild Icon',
                                    media: { url: owner?.iconURL() || defaultGuildIcon }
                                }
                            ]
                        }),

                    ]
                })


                // Send Log Msg
                const send = await sendLogMessage(msgContainer, logChannels.entitlement_updates)
                if (!send.success) throw send;

            } catch (err) { // Error Occurred
                createLog.for('Bot').warn(`Failed to post event "Entitlement Created" to internal Discord Log.`, { err })
            }
        },


        /** Logs an entitlement after its updated or deleted. */
        entitlementUpdated: async (entitlement: Entitlement) => {
            try {
                const { botClient: bot, storeSKUs, colors: { getOxColor } } = core;
                const skuInfo: Partial<SKU> = storeSKUs[entitlement.skuId] || null;
                const status = entitlement.isActive() ? 'ACTIVE' : 'INACTIVE';
                const expiresAt = () => {
                    if (entitlement.isTest()) return '`TEST`'
                    if (!entitlement.isActive()) return '`EXPIRED`'
                    if (entitlement.endsTimestamp) return `<t:${DateTime.fromMillis(entitlement.endsTimestamp).toSeconds()}:F>`
                    else return '`NO EXPIRATION`'
                }
                const owner = entitlement.isGuildSubscription()
                    ? await bot.guilds.fetch(entitlement.guildId)
                    : null;

                // Build 'Event Message'
                const msgContainer = new ContainerBuilder({
                    accent_color: getOxColor(entitlement.isActive() ? 'purple' : 'error'),
                    components: <any>[
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `## 🛍️ Entitlement Updated` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `### Product Name: \n> ${skuInfo?.name}` }),
                        new TextDisplayBuilder({ content: `### Status: \n> \`${status}\`` }),
                        new TextDisplayBuilder({ content: `### Expires at: \n> ${expiresAt()}` }),
                        new TextDisplayBuilder({ content: `### Guild Name: \n> ${owner?.name}` }),
                        new TextDisplayBuilder({ content: `### Guild Id: \n> ${owner?.id}` }),
                        new TextDisplayBuilder({ content: `### SKU Id: \n> ${entitlement?.skuId}` }),
                        new TextDisplayBuilder({ content: `### Entitlement Id: \n> ${entitlement?.id}` }),
                        new MediaGalleryBuilder({
                            items: [
                                {
                                    description: 'Guild Icon',
                                    media: { url: owner?.iconURL() || defaultGuildIcon }
                                }
                            ]
                        }),

                    ]
                })


                // Send Log Msg
                const send = await sendLogMessage(msgContainer, logChannels.entitlement_updates)
                if (!send.success) throw send;

            } catch (err) { // Error Occurred
                createLog.for('Bot').warn(`Failed to post event "Entitlement Updated" to internal Discord Log.`, { err })
            }
        },

    }

}