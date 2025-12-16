import { ButtonStyle, ComponentType, ContainerBuilder, PermissionsString, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import core from "../core.js"
// import guildManager from "../database/guildManager.js";
import logtail from "../logs/logtail.js";
import sendWithFallback from "./sendWithFallback.js";
import { ErrorResult, SuccessResult } from "@sessionsbot/shared";

/** Full array of every permission that must be granted to SessionsBot within guilds/signup channels. */
const requiredBotPerms: PermissionsString[] = [
    "CreatePrivateThreads", "CreatePublicThreads", "EmbedLinks", "ManageChannels",
    "ManageMessages", "ManageThreads", "MentionEveryone", "ReadMessageHistory",
    "SendMessages", "SendMessagesInThreads", "ViewChannel"
]

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
        let missingSignupChannelPerms: { [signupChannelId: string]: PermissionsString[] } = {};

        // Check Cooldown:
        if (canAlert(guildId)) startCooldown(guildId);
        else return new ErrorResult('COOLDOWN', null);

        // Fetch guild:
        const result = await guildManager.fetchGuildData(guildId)
        const guildData = result.success ? result.data.docData : null;
        const guild = result.success ? result.data.guildFetch : null;

        // Check Global Perms:
        const botRole = guild.roles.botRoleFor(core.botClient.user);
        const globalPermsGranted = botRole.permissions.toArray();
        for (const perm of requiredBotPerms) {
            if (!globalPermsGranted.includes(perm)) missingGlobalPerms.push(perm)
        }

        // Check Each Signup Channel:
        for (const [channelId, channelData] of Object.entries(guildData.configuration.signupChannels)) {
            missingSignupChannelPerms[channelId] = [];
            const channel = await guild.channels.fetch(channelId);
            const grantedPerms = channel.permissionsFor(guild.members.me).toArray()
            // Confirm each req perm is granted in this channel:
            for (const perm of requiredBotPerms) {
                if (!grantedPerms.includes(perm)) missingSignupChannelPerms[channelId].push(perm)
            }
        }

        // Send Permissions Alert if Required:
        const insufficientPermissions = (missingGlobalPerms.length >= 1 || Object.entries(missingSignupChannelPerms).some(chn => chn[1].length >= 1))

        if (insufficientPermissions) {

            const permErrorSources = () => {
                let response = [];

                // Global Perms Info
                if (missingGlobalPerms.length) {
                    response.push(new SectionBuilder({
                        components: <any>[
                            new TextDisplayBuilder({
                                content: `### 🌍  GLOBALLY - *Bot Role*
                            \n**How to Fix**: \n> You can easily resolve this issue by re-inviting Session Bot to your server with the "Re-Invite" button. This will refresh the permissions granted to the bot within this server. \n**Missing Permissions:** \n> ${missingGlobalPerms.length ? ('- `' + missingGlobalPerms.join('`\n> - `') + '`') : '`- ✔ NONE`'}`
                            })
                        ],
                        accessory: {
                            type: ComponentType.Button,
                            style: ButtonStyle.Link,
                            url: core.urls.inviteBot,
                            label: `🔃 Re-Invite Bot`
                        }
                    }))
                    response.push(new SeparatorBuilder())
                }

                // SignupChannel Perms Info
                if (Object.entries(missingSignupChannelPerms).some(chn => chn[1].length >= 1)) {
                    // For each channel missing perms:
                    for (const [channelId, missingPerms] of Object.entries(missingSignupChannelPerms)) {
                        if (missingPerms.length) {
                            response.push(new SectionBuilder({
                                components: <any>[
                                    new TextDisplayBuilder({
                                        content: `### 📝 Signup Channel - <#${channelId}>
                                        \n**How to Fix**: \n> You can easily resolve this issue by granting Session Bot **EACH** of its required permissions within <#${channelId}>'s channel settings. Make sure theres no permission overwrites causing issues here! \n**Missing Permissions:** \n> ${missingPerms.length ? ('- `' + missingPerms.join('`\n> - `') + '`') : '- `✔ NONE`'}`
                                    })
                                ],
                                accessory: {
                                    type: ComponentType.Button,
                                    style: ButtonStyle.Link,
                                    url: core.urls.support.serverInvite,
                                    label: `💬 Get Support`
                                }
                            }))
                            response.push(new SeparatorBuilder())
                        }
                    }
                }

                if (!response.length) response.push(new SeparatorBuilder())
                return response
            }

            const msg = new ContainerBuilder({
                accent_color: core.colors.getOxColor('warning'),
                components: <any>[
                    new TextDisplayBuilder({ content: `# ❗ I'm Missing Required Permissions!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `## All Required Permissions: \nIn order this bot to function properly make sure **EACH** of these permissions are granted: \n> \`${requiredBotPerms.join(', ')}\` ` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `## 🔎 Where Im Missing Permissions:` }),
                    new SeparatorBuilder(),
                    ...permErrorSources(),
                    new TextDisplayBuilder({ content: `-# [Read Documentation](${core.urls.docs.requiredBotPermissions}) | [Get Support](${core.urls.support.serverInvite}) | [Support Resources](${core.urls.support.onlineResources})` })
                ]
            })

            const sendResult = await sendWithFallback(guildId, msg)
            if (!sendResult.success) throw sendResult;
            return new SuccessResult({ missingGlobalPerms, missingSignupChannelPerms })
        }


    } catch (err) {
        // Log Error:
        logtail.warn('[!!] Failed to run PERMISSION CHECKS for guild! - See Details', { err });
        return new ErrorResult('Failed to run permission checks for guild!', err)
    }
}