import { ButtonStyle, ComponentType, ContainerBuilder, PermissionsString, SectionBuilder, SeparatorBuilder, TextChannel, TextDisplayBuilder } from "discord.js";
import core from "../../core/core.js"
import { useLogger } from "../../logs/logtail.js";
import sendWithFallback from "../messages/sendWithFallback.js";
import { Result } from "@sessionsbot/shared";
import { requiredBotPermsStrings } from './required';
import { URLS } from "../../core/urls.js";
import { supabase } from "../../database/supabase.js";

const createLog = useLogger();

export const isBotPermissionError = (err: any) => {
    return [50013, 50001, 50007].includes(err?.code);
}

// Util: Alert Cooldown(s):
const alertCooldown = new Set()
const canAlert = (guildId: string) => !alertCooldown.has(guildId);
const startCooldown = (guildId: string) => {
    alertCooldown.add(guildId);
    setTimeout(() => alertCooldown.delete(guildId), 30_000);
}

// Check granted permissions for a givin guild:
export const sendPermissionAlert = async (guildId: string) => {
    try {
        // Check/Start Cooldown:
        if (canAlert(guildId)) startCooldown(guildId);
        else return Result.err('COOLDOWN', null);

        // Fetch Guild Instance & DB Data:
        const [guild, { data: guildData, error: guildDbError }] = await Promise.all([
            core.botClient.guilds.fetch(guildId),
            supabase.from('guilds')
                .select('*, session_templates!inner(channel_id, id, title)')
                .eq('id', guildId)
                .maybeSingle()
        ])

        // Confirm Guild and Data was fetched:
        if (!guild) {
            createLog.for('Bot').warn('Failed to fetch guild instance for permission check/alert!')
            return
        }
        if (guildDbError || !guildData) createLog.for('Database').error('Failed to fetch guild data for a permission check/alert!', { guildDbError, guildData, guildId })

        // Check Global Perms:
        const botRole = guild.roles.botRoleFor(core.botClient.user);
        if (!botRole) {
            createLog.for('Bot').error('Bot role missing in guild!', { guildId });
            return Result.err('Bot role could not be found for permission check in guild.');
        }
        const globalPermsGranted = botRole.permissions.toArray() ?? [];
        const missingGlobalPerms = requiredBotPermsStrings.filter(p => !globalPermsGranted.includes(p))

        // If Template Channels - Check Perms:
        const me = guild.members.me ?? await guild.members.fetchMe();
        let missingChannelPerms = new Map<string, PermissionsString[]>();
        const templateChannels = guildData?.session_templates?.map(t => t?.channel_id) ?? [];
        for (const channelId of templateChannels) {
            // Check permissions for channel:
            const channel = await core.botClient.channels.fetch(channelId) as TextChannel
            if (!channel) {
                createLog.for('Database').warn('Failed to fetch a channel for a permission check! - Certainly missing permissions!! - See Details', { channelId, guildId, missingGlobalPerms })
                continue
            }
            const channelPerms = channel.permissionsFor(me)?.toArray() ?? [];
            const missingPermissions: PermissionsString[] = requiredBotPermsStrings.filter(p => !channelPerms.includes(p))
            // if (missingPermissions?.length) { // always include
            missingChannelPerms.set(channelId, missingPermissions);
            // }
        }

        // Send Permissions Alert if Required:
        const insufficientPermissions = (missingGlobalPerms.length > 0) || ([...missingChannelPerms.values()]?.length > 0)


        if (insufficientPermissions) {

            const permErrorSources = () => {
                let response = [];

                // Global Perms Info
                if (missingGlobalPerms) {
                    response.push(new SectionBuilder({
                        components: <any>[
                            new TextDisplayBuilder({
                                content: `## ${core.emojis.string('globe')}  Missing Bot Role Permissions: \n> ${missingGlobalPerms.length ? ('- `' + missingGlobalPerms.join('`\n> - `') + '`') : '`- ✔ NONE`'} \n**How to Fix**: \n> You can easily resolve this issue by re-inviting Sessions Bot to your server with the "Re-Invite" button. This will refresh the permissions granted to the bot within this server. \n-# --- or --- \n> You can also manually reassign permissions to the bot's role within your Server Settings > Roles > <@&${botRole.id}> > Permissions > (manually reassign).`
                            })
                        ],
                        accessory: {
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            url: URLS.invite_bot.direct,
                            emoji: { id: core.emojis.ids.undo },
                            label: `Re-Invite Bot`
                        }
                    }))
                    response.push(new SeparatorBuilder())
                }

                // Template Channel Perms Missing:
                if (missingChannelPerms?.size > 0) {
                    // Create Missing Channel Perms Text
                    let missingChannelPermsText = ``
                    for (const [id, perms] of missingChannelPerms.entries()) {
                        if (missingChannelPermsText?.length != 0) missingChannelPermsText += `\n`
                        missingChannelPermsText += `<#${id}>: \n> ${perms.length ? ('- `' + perms.join('`\n> - `') + '`') : '`- ✔ NONE`'}`
                    }

                    response.push(new SectionBuilder({
                        components: <any>[
                            new TextDisplayBuilder({ content: `## ${core.emojis.string('lock')}  Missing Post Channel Permissions: \n${missingChannelPermsText} \n**How to Fix**: \n> You can resolve this by manually removing any permission overrides blocking a required permission. To check permission overrides for a channel access Channel Settings > Permissions > <@&${botRole.id}> > (manually reassign).` })
                        ],
                        accessory: {
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            url: URLS.doc_links.bot_permissions,
                            emoji: { id: core.emojis.ids.info },
                            label: 'Documentation'
                        }
                    }))
                    response.push(new SeparatorBuilder())
                } else {
                    response.push(
                        new TextDisplayBuilder({ content: `> We also ran a permission check for all of your active signup channels - No issues were found from permission overrides! \n-# Checked Channels: <#${templateChannels.join(`>, <#`)}>` }),
                        new SeparatorBuilder()
                    )
                }

                return response
            }

            const msg = new ContainerBuilder({
                accent_color: core.colors.getOxColor('error'),
                components: <any>[
                    new TextDisplayBuilder({ content: `# ${core.emojis.string('warning')} I'm Missing Required Permissions! \n-# <@${guild.ownerId}> @here` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('star')}  All Required Permissions: \nIn order this bot to function properly make sure **EACH** of these permissions are granted: \n> \`${requiredBotPermsStrings.join(', ')}\` ` }),
                    new SeparatorBuilder(),
                    ...permErrorSources(),
                    new TextDisplayBuilder({ content: `-# [Read Documentation](${URLS.doc_links.bot_permissions}) | [Support Chat](${URLS.support_chat}) | [Support Resources](${URLS.site_links.support})` })
                ]
            })

            const sendResult = await sendWithFallback(guildId, msg)
            if (!sendResult.success) throw sendResult;
            return Result.ok({ missingGlobalPerms, missingChannelPerms })
        } else {
            return Result.err('No missing permission(s) found!');
        }


    } catch (err) {
        // Log Error:
        createLog.for('Bot').warn('[!!] Failed to run PERMISSION CHECKS/SEND ALERT for guild! - See Details', { err, guildId });
        return Result.err('Failed to run permission checks for guild!', err)
    }
}