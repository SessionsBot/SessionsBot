import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, PermissionsString, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import core from "../../core/core";
import { supabase } from "../../database/supabase";
import { useLogger } from "../../logs/logtail";
import { requiredBotPermsStrings } from "./required";
import sendWithFallback from "../messages/sendWithFallback";
import { URLS } from "../../core/urls";
import { SessionPostFailureReason } from "../../database/schedules/templateCreations";
import { DateTime } from "luxon";

const createLog = useLogger();


/** Should be called when the bot cannot post a `Session Signup` message due to **PERMISSIONS**! */
export async function sendSessionPostFailedFromPerms(guildId: string, templateIds: string[]) {
    try {
        // Vars - Setup:
        const { botClient: bot } = core;

        // Fetch Discord Guild:
        const guild = await bot.guilds.fetch(guildId)
        if (!guild) throw `Failed to fetch Guild Instance from Bot Client! - Has this sever removed the bot?`;

        // Fetch Active Session Templates -> Post Channels:
        const { data: guildTemplates, error: templatesError } = await supabase
            .from('session_templates')
            .select('*')
            .eq('enabled', true)
            .in('id', templateIds)
            .gte('next_post_utc', DateTime.utc().minus({ minutes: 10 }).toISO())
        if (templatesError) throw { message: 'Failed to fetch current active guild templates', templatesError }
        if (!guildTemplates || !guildTemplates?.length) throw { message: 'Failed to fetch current active guild templates - Length: 0?', templatesError }

        // Get Active Post Channels from Templates:
        const postChannels = new Set<string>()
        guildTemplates.forEach(t => postChannels.has(t.channel_id)
            ? () => { }
            : postChannels.add(t.channel_id)
        )

        // Check Bot Permissions:
        const botRole = guild.roles.botRoleFor(bot.user);
        const globalBotPerms = botRole.permissions.serialize()
        const missingGlobalPerms: PermissionsString[] = requiredBotPermsStrings.filter(p => !globalBotPerms[p]);
        const missingChannelPerms = new Map<String, PermissionsString[]>()

        // For Each Post Channel - Permissions:
        for (const id of postChannels) {
            const channel = await guild.channels.fetch(id);
            if (!channel) {
                createLog.for('Bot').error('Failed to fetch an "Active Post Channel" for Session Template - Post Failure Alert!.', { channel, id, guildId });
                continue
            }
            const channelPermissions = channel.permissionsFor(bot.user).serialize();
            const missingPermissions = requiredBotPermsStrings.filter(p => !channelPermissions[p]);
            // Push to missing perms array:
            if (missingPermissions?.length) {
                missingChannelPerms.set(id, missingPermissions)
            }
        }

        // If All Permissions Granted - Warn:
        if (!missingGlobalPerms?.length && !missingChannelPerms?.size) {
            createLog.for('Unknown').warn('Permissions Missing Alert (checks) function called with no missing permissions!')
            return
        }

        const missingGlobalPermsTEXT = missingGlobalPerms?.length
            ? `> - \`✖ ${missingGlobalPerms.join(`\`\n> - \`✖ `)}\``
            : `> - \`✔ None\``
        const missingTemplateIdsTEXT = templateIds?.length
            ? `> - \`✖ ${templateIds.join(`\`\n> - \`✖ `)}\``
            : `> - \`✔ None\``
        const missingChannelPermsTEXT = () => {
            if (missingChannelPerms.size) {
                let r = ``;
                for (const [id, perms] of missingChannelPerms.entries()) {
                    if (r != '') r += '\n'
                    r += `> - <#${id}>` + `\n>    - \`✖ ${perms.join(`\`\n>    - \`✖ `)}\``
                }
                return r;
            } else return `\`✔ None\``
        }

        // Build Alert Message:
        const alertMsg = new ContainerBuilder({
            accent_color: core.colors.getOxColor('error'),
            components: <any>[
                new TextDisplayBuilder({ content: `## ${core.emojis.string('warning')}  I'm missing required permissions! - Session(s) __NOT__ Posted \n-# Please confirm bot & channel permissions so that Sessions Bot can function properly. -- @here <@${guild.ownerId}>` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `${core.emojis.string('globe')}  **Missing Server Permissions**: \n${missingGlobalPermsTEXT} \n-# __How to Fix:__ By accessing your Server Settings > Roles > <@&${botRole.id}> > (re-assign permissions)` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `${core.emojis.string('list')}  **Missing Channel Permissions**: \n${missingChannelPermsTEXT()} \n-# __How to Fix:__ By accessing your Channel Settings > Permissions > <@&${botRole.id}> > (re-assign permissions)` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `${core.emojis.string('info')}  **Missed Session Template IDs:** \n${missingTemplateIdsTEXT}` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `**${core.emojis.string('help')}  Still Need Help?** \n-# Don't worry, there's plenty or resources to help you resolve your issues with Sessions Bot!` }),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            emoji: { name: 'success', id: core.emojis.ids.success },
                            label: 'ALL Required Permissions',
                            url: URLS.doc_links.bot_permissions,
                            style: ButtonStyle.Link
                        }),
                        new ButtonBuilder({
                            emoji: { name: 'chat', id: core.emojis.ids.chat },
                            label: 'Support Chat',
                            url: URLS.support_chat,
                            style: ButtonStyle.Link
                        }),
                        new ButtonBuilder({
                            emoji: { name: 'star', id: core.emojis.ids.star },
                            label: 'More Resources',
                            url: URLS.site_links.support,
                            style: ButtonStyle.Link
                        })
                    ]
                })
            ]
        })

        // Send w/ Fallback
        await sendWithFallback(guildId, alertMsg)


    } catch (err) {
        // Failed to Send Alert - Log & Return:
        createLog.for('Bot').error('FAILED TO SEND SESSION(s) POST FAILURE ALERT! - See details...', { err, guildId, templateIds })
    }
}


/** Should be called when the bot cannot post a `Session Signup` message due to **DB or OTHER ERROR BESIDES PERMISSIONS**! */
export async function sendSessionPostFailedFromErrorAlert(guildId: string, reason: SessionPostFailureReason, templateIds: string[]) {
    try {
        // Vars - Setup:
        const { botClient: bot } = core;

        // Fetch Discord Guild:
        const guild = await bot.guilds.fetch(guildId)
        if (!guild) throw `Failed to fetch Guild Instance from Bot Client! - Has this sever removed the bot?`;

        const missingTemplateIdsTEXT = templateIds?.length
            ? `> - \`✖ ${templateIds.join(`\`\n> - \`✖ `)}\``
            : `> - \`✔ None\``

        // Build Alert Message:
        const alertMsg = new ContainerBuilder({
            accent_color: core.colors.getOxColor('error'),
            components: <any>[
                new TextDisplayBuilder({ content: `## ${core.emojis.string('warning')}  Failed to Post Session! \n-# Something went haywire and we wen't able to post at least one of you session schedules. -- @here <@${guild.ownerId}>` }),
                new TextDisplayBuilder({ content: `${core.emojis.string('info')}  **Details:** \n> Unfortunately when we tried posting one *(or more)* of your sessions we encored some sort of issue. This __likely shouldn't be happening__, check out our support resources or feel free to get in touch with our [Bot Support](${URLS.support_chat}) team.` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `${core.emojis.string('list')}  **Missed Session Template IDs:** \n${missingTemplateIdsTEXT}` }),
                new SeparatorBuilder(),
                new TextDisplayBuilder({ content: `**${core.emojis.string('help')}  Still Need Help?** \n-# Don't worry, there's plenty or resources to help you resolve your issues with Sessions Bot!` }),
                new ActionRowBuilder({
                    components: [
                        new ButtonBuilder({
                            emoji: { name: 'chat', id: core.emojis.ids.chat },
                            label: 'Support Chat',
                            url: URLS.support_chat,
                            style: ButtonStyle.Link
                        }),
                        new ButtonBuilder({
                            emoji: { name: 'globe', id: core.emojis.ids.globe },
                            label: 'Status Page',
                            url: URLS.status_page,
                            style: ButtonStyle.Link
                        }),
                        new ButtonBuilder({
                            emoji: { name: 'help', id: core.emojis.ids.star },
                            label: 'More Resources',
                            url: URLS.site_links.support,
                            style: ButtonStyle.Link
                        })
                    ]
                })
            ]
        })

        // Send w/ Fallback
        await sendWithFallback(guildId, alertMsg)

    } catch (err) {
        // Failed to Send Alert - Log & Return:
        createLog.for('Bot').error('FAILED TO SEND SESSION(s) POST FAILURE ALERT! - See details...', { err, guildId, reason, templateIds })
    }
}