import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import core from "../../core/core";
import { supabase } from "../../database/supabase";
import { useLogger } from "../../logs/logtail";
import { requiredBotPermsStrings } from "./required";
import sendWithFallback from "../messages/sendWithFallback";

const createLog = useLogger();

/** Should be called when the bot cannot post a `Session Signup` message due to **PERMISSIONS**! */
export async function sendFailedToPostSessionAlert(guildId: string, channelId: string, templateIds: string[]) {
    // Get Vars:
    const { botClient: bot, colors, urls } = core;
    const guild = await bot.guilds.fetch(guildId);
    const channel = guild ? await guild.channels.fetch(channelId) : null;
    const { data: templates, error: templateErr } = await supabase.from('session_templates').select('*').in('id', templateIds);
    // Confirm Vars:
    if (!guild) createLog.for('Bot').error('Failed to fetch guild for `sendFailedToPostSessionAlert()` - See Details!', { guildId, channelId, templateIds })
    if (!templates || templateErr) createLog.for('Database').error('Failed to fetch session template for `sendFailedToPostSessionAlert()` - See Details!', { guildId, channelId, templateIds, templateErr })
    // Get Missing Perm(s) for Channel:
    const botRole = guild.roles.botRoleFor(bot.user);
    const channelsPerms = channel.permissionsFor(botRole, true).serialize()
    const requiredPerms = requiredBotPermsStrings
    let missingPerms = [];
    for (const perm of requiredPerms) {
        if (!channelsPerms[perm]) missingPerms.push(perm);
    }
    let missingPermsText = missingPerms.length ? '> - ' + missingPerms.join('\n> - ') : '> None ✔';
    let missedTemplateNamesText = templates?.length ? '> - ' + templates.map(t => t.title).join('\n> - ') : '> None ✔';

    // Build Message:
    const alertMsg = new ContainerBuilder({
        accent_color: colors.getOxColor('error'),
        components: <any>[
            new TextDisplayBuilder({ content: `## ⚠️ Uh oh! I couldn't post a session... \n-# **CRITICAL** - Take Action` }),
            new SeparatorBuilder(),
            new TextDisplayBuilder({ content: `**🎯 Target Channel:** \n> <#${channelId}> \n**🎫 Missing Permission(s)** \n${missingPermsText} \n**🗃️ Missed Session(s)** \n${missedTemplateNamesText}` }),
            new SeparatorBuilder(),
            new TextDisplayBuilder({ content: `Please ensure that <@${bot.user.id}> has the **[correct permissions](${urls.docs.requiredBotPermissions})** to post Session Signup posts within this <#${channelId}> channel!` }),
            new SeparatorBuilder(),
            new ActionRowBuilder({
                components: [
                    new ButtonBuilder({
                        style: ButtonStyle.Link,
                        url: urls.support.serverInvite,
                        label: '💬 Chat with Support'
                    }),
                    new ButtonBuilder({
                        style: ButtonStyle.Link,
                        url: urls.docs.requiredBotPermissions,
                        label: '📃 Read Documentation'
                    }),
                    new ButtonBuilder({
                        style: ButtonStyle.Link,
                        url: `https://sessionsbot.fyi/dashboard`,
                        label: '💻 View Dashboard'
                    })
                ]
            })
        ]
    })

    // Send w/ Fallback:
    return await sendWithFallback(guildId, alertMsg)
}