import { ContainerBuilder, Guild, MediaGalleryBuilder, MessageFlags, SeparatorBuilder, TextChannel, TextDisplayBuilder } from 'discord.js';
import core from '../core.js'
import logtail from './logtail.js'
import { DateTime } from 'luxon';

// Discord Ids:
let logGuildId = process.env?.['GUILD_ID_PUBLIC'];
let joinLeaveLogChannelId = '1424195270618644655';
let serverSetupsChannelId = '1425618357415317545';

const defaultGuildIcon = 'https://images-wixmp-ed30a86b8c4ca887773594c2.wixmp.com/f/198142ac-f410-423a-bf0b-34c9cb5d9609/dbtif5j-60306864-d6b7-44b6-a9ff-65e8adcfb911.png/v1/fit/w_128,h_128,q_70,strp/discord_metro_icon_by_destuert_dbtif5j-375w-2x.jpg?token=eyJ0eXAiOiJKV1QiLCJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ1cm46YXBwOjdlMGQxODg5ODIyNjQzNzNhNWYwZDQxNWVhMGQyNmUwIiwiaXNzIjoidXJuOmFwcDo3ZTBkMTg4OTgyMjY0MzczYTVmMGQ0MTVlYTBkMjZlMCIsIm9iaiI6W1t7ImhlaWdodCI6Ijw9NTEyIiwicGF0aCI6Ii9mLzE5ODE0MmFjLWY0MTAtNDIzYS1iZjBiLTM0YzljYjVkOTYwOS9kYnRpZjVqLTYwMzA2ODY0LWQ2YjctNDRiNi1hOWZmLTY1ZThhZGNmYjkxMS5wbmciLCJ3aWR0aCI6Ijw9NTEyIn1dXSwiYXVkIjpbInVybjpzZXJ2aWNlOmltYWdlLm9wZXJhdGlvbnMiXX0.1Fi0jR0YCIK_seYmEuy6R_LyBrJM4K6HOPXAtsf-3yQ';

// For Dev Environment:
if(process.env?.['ENVIRONMENT'] == 'development'){
    logGuildId = process.env?.['GUILD_ID_DEVELOPMENT'];
    const devTestChannelId = '1413653266931122186'
    joinLeaveLogChannelId = devTestChannelId;
    serverSetupsChannelId = devTestChannelId;
}

/** Logging methods to internal Discord Server! */ 
export default {

    /** Log a specific event occurrence to logs. */
    events: {

        /** Logs a guild that had just added Sessions Bot */
        guildAdded: async (addedGuild:Guild) => { try {

            // Convert Timestamp
            const createdAt = Math.floor(DateTime.fromMillis(addedGuild?.createdTimestamp).toSeconds());
            const joinedAt = Math.floor(DateTime.fromMillis(addedGuild?.joinedTimestamp).toSeconds());
            
            // Build 'Event Message'
            const msgContainer = new ContainerBuilder({
                accent_color: core.colors.getOxColor('success'),
                components: <any>[
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `## ✅ Bot Added to Server`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `### Name: \n> ${addedGuild?.name}`}),
                    new TextDisplayBuilder({content: `### Created at: \n> <t:${createdAt}:F>`}),
                    new TextDisplayBuilder({content: `### Joined at: \n> <t:${joinedAt}:F>`}),
                    new TextDisplayBuilder({content: `### Member Count: \n> ${addedGuild?.memberCount}`}),
                    new TextDisplayBuilder({content: `### Guild Icon:`}),
                    new MediaGalleryBuilder({
                        items: [
                            {
                                description: 'Guild Icon',
                                media: {url: addedGuild?.iconURL() || defaultGuildIcon}
                            }
                        ]
                    }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `-# Guild Id: ${addedGuild?.id}`}),
                    new SeparatorBuilder(),


                ]
            })
            
            // Fetch Log Channel
            const logGuild = await core.botClient.guilds.fetch(logGuildId);
            if(!logGuild) throw `Failed to fetch guild for logging event`
            const logChannel = await logGuild.channels.fetch(joinLeaveLogChannelId)
            if(!logChannel || !logChannel.isSendable()) throw `Failed to fetch channel for logging event`
            
            // Send Log Msg
            await logChannel.send({
                components: [msgContainer],
                flags: MessageFlags.IsComponentsV2
            })

        } catch(err) { // Error Occurred
            logtail.warn(`[?] Failed to post event "Guild Added" to internal Discord Log.`, {err})
        }},

        /** Logs a guild that had just removed Sessions Bot */
        guildRemoved: async (guildRemoved:Guild, wasSetup:boolean) => {try {
            
            // Convert Timestamps
            const joinedAt = Math.floor(DateTime.fromMillis(guildRemoved?.joinedTimestamp).toSeconds());
            const leftAt = Math.floor(DateTime.now().toSeconds());

            // Build 'Event Message'
            const msgContainer = new ContainerBuilder({
                accent_color: core.colors.getOxColor('warning'),
                components: <any>[
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `## ❌ Bot Removed from Server`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `### Name: \n> ${guildRemoved?.name}`}),
                    new TextDisplayBuilder({content: `### Was Setup: \n> ${wasSetup}`}),
                    new TextDisplayBuilder({content: `### Joined at: \n> <t:${joinedAt}:F>`}),
                    new TextDisplayBuilder({content: `### Left at: \n> <t:${leftAt}:F>`}),
                    new TextDisplayBuilder({content: `### Member Count: \n> ${guildRemoved?.memberCount}`}),
                    new TextDisplayBuilder({content: `### Guild Icon:`}),
                    new MediaGalleryBuilder({
                        items: [
                            {
                                description: 'Guild Icon',
                                media: {url: guildRemoved?.iconURL() || defaultGuildIcon}
                            }
                        ]
                    }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `-# Guild Id: ${guildRemoved?.id}`}),
                    new SeparatorBuilder(),


                ]
            })


            // Fetch Log Channel
            const logGuild = await core.botClient.guilds.fetch(logGuildId);
            if(!logGuild) throw `Failed to fetch guild for logging event`
            const logChannel = await logGuild.channels.fetch(joinLeaveLogChannelId)
            if(!logChannel || !logChannel.isSendable()) throw `Failed to fetch channel for logging event`
            
            // Send Log Msg
            await logChannel.send({
                components: [msgContainer],
                flags: MessageFlags.IsComponentsV2
            })

        } catch(err) { // Error Occurred
            logtail.warn(`[?] Failed to post event "Guild Removed" to internal Discord Log.`, {err})
        }},

        /** @deprecated Logs a guild that had just configured their Sessions Bot */
        guildSetup: async (guildId, configuration:{accentColor:string, allGuildSchedules:any, panelChannelId, dailySignupPostTime, signupMentionIds, timeZone}) => {try {
            if(!guildId || !configuration) throw {message: 'Invalid Input - missing either "guildId", or "configuration"!', inputs: {guildId, configuration}}

            // Fetch Discord Guild Data
            const guildDiscordData = await core.botClient.guilds.fetch(guildId)
            // Icon
            const guildIcon = guildDiscordData?.iconURL({size: 128}) || undefined
            // Timestamps
            const guildJoinedAt = Math.floor(DateTime.fromMillis(guildDiscordData.joinedTimestamp).toSeconds());
            const guildSetupAt = Math.floor(DateTime.now().toSeconds())

            // Build Message:
            const container = new ContainerBuilder({
                accent_color: Number(configuration?.accentColor) || Number(core.colors.getOxColor('purple')),
                components: <any>[
                    new TextDisplayBuilder({content: `## ✅ \`${guildDiscordData?.name}\` Completed Setup!`}),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `### Name: \n> ${guildDiscordData?.name}`}),
                    new TextDisplayBuilder({content: `### Joined At: \n> <t:${guildJoinedAt}:F>`}),
                    new TextDisplayBuilder({content: `### Setup At: \n> <t:${guildSetupAt}:F>`}),
                    new TextDisplayBuilder({content: `### Sessions Scheduled: \n> ${configuration?.allGuildSchedules?.length}`}),
                    new TextDisplayBuilder({content: `### Member Count: \n> ${guildDiscordData?.memberCount}`}),
                    new TextDisplayBuilder({content: `### Guild Icon:`}),
                    new MediaGalleryBuilder({
                        items: [
                            {
                                description: 'Guild Icon',
                                media: {url: guildIcon || defaultGuildIcon}
                            }
                        ]
                    }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({content: `-# Guild Id: ${guildId}`}),
                    new SeparatorBuilder(),
                ]
            })

            // Send Message:
            const logGuild = await core.botClient.guilds.fetch(logGuildId);
            if(!logGuild) throw `Failed to fetch internal guild for log event.`
            const logChannel = await logGuild.channels.fetch(serverSetupsChannelId)
            if(!logChannel || !logChannel.isSendable()) throw `Failed to fetch internal guild chanel for log event.`
            
            await logChannel.send({
                components: [container],
                flags: MessageFlags.IsComponentsV2
            })

        } catch (err) { // Error Occurred
            logtail.warn(`[?] Failed to post event "Guild Setup" to internal Discord Log.`, {err})
        }},

        

    }

}