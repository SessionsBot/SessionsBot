import { ButtonStyle, ComponentType, ContainerBuilder, PermissionFlagsBits, PermissionsString, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import core from "../../core/core.js"
// import guildManager from "../database/guildManager.js";
import { useLogger } from "../../logs/logtail.js";
import sendWithFallback from "../messages/sendWithFallback.js";
import { Result } from "@sessionsbot/shared";
import { requiredBotPermsStrings } from './required';
import { URLS } from "../../core/urls.js";

const createLog = useLogger();

export const isBotPermissionError = (err: any) => {
    return [50013, 50001, 50007].includes(err?.code);
}

const alertCooldown = new Set()
const canAlert = (guildId: string) => !alertCooldown.has(guildId);
const startCooldown = (guildId: string) => {
    alertCooldown.add(guildId);
    setTimeout(() => alertCooldown.delete(guildId), 30_000);
}

// Check granted permissions for a givin guild:
export const sendPermissionAlert = async (guildId: string) => {
    try {
        let missingGlobalPerms: PermissionsString[] = [];

        // Check Cooldown:
        if (canAlert(guildId)) startCooldown(guildId);
        else return Result.err('COOLDOWN', null);

        // Fetch guild:
        const guild = await core.botClient.guilds.fetch(guildId)

        // Check Global Perms:
        const botRole = guild.roles.botRoleFor(core.botClient.user);
        const globalPermsGranted = botRole.permissions.toArray();
        for (const perm of requiredBotPermsStrings) {
            if (!globalPermsGranted.includes(perm)) missingGlobalPerms.push(perm)
        }

        // Send Permissions Alert if Required:
        const insufficientPermissions = (missingGlobalPerms.length >= 1)

        if (insufficientPermissions) {

            const permErrorSources = () => {
                let response = [];

                // Global Perms Info
                if (missingGlobalPerms.length) {
                    response.push(new SectionBuilder({
                        components: <any>[
                            new TextDisplayBuilder({
                                content: `### 🌍  Missing Bot Role Permissions:
                            \n> ${missingGlobalPerms.length ? ('- `' + missingGlobalPerms.join('`\n> - `') + '`') : '`- ✔ NONE`'} \n**How to Fix**: \n> You can easily resolve this issue by re-inviting Sessions Bot to your server with the "Re-Invite" button. This will refresh the permissions granted to the bot within this server. \n-# --- or --- \n> You can also manually reassign permissions to the bot's role within your Server Settings > Roles > <@&${botRole.id}> > Permissions > (manually reassign).`
                            })
                        ],
                        accessory: {
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            url: URLS.invite_bot.direct,
                            label: `🔃 Re-Invite Bot`
                        }
                    }))
                    response.push(new SeparatorBuilder())
                }

                if (!response.length) response.push(new SeparatorBuilder())
                return response
            }

            const msg = new ContainerBuilder({
                accent_color: core.colors.getOxColor('warning'),
                components: <any>[
                    new TextDisplayBuilder({ content: `# ❗ I'm Missing Required Permissions!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `## All Required Permissions: \nIn order this bot to function properly make sure **EACH** of these permissions are granted: \n> \`${requiredBotPermsStrings.join(', ')}\` ` }),
                    new SeparatorBuilder(),
                    ...permErrorSources(),
                    new TextDisplayBuilder({ content: `-# [Read Documentation](${URLS.doc_links.bot_permissions}) | [Support Chat](${URLS.support_chat}) | [Support Resources](${URLS.site_links.support})` })
                ]
            })

            const sendResult = await sendWithFallback(guildId, msg)
            if (!sendResult.success) throw sendResult;
            return Result.ok({ missingGlobalPerms })
        } else {
            return Result.err('No missing permission(s) found!');
        }


    } catch (err) {
        // Log Error:
        createLog.for('Bot').warn('[!!] Failed to run PERMISSION CHECKS for guild! - See Details', { err });
        return Result.err('Failed to run permission checks for guild!', err)
    }
}