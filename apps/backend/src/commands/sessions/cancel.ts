import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, CommandInteraction, ContainerBuilder, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, SlashCommandStringOption, TextDisplayBuilder } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import core from "../../utils/core/core";
import { getTimeZones } from '@vvo/tzdb'
import { defaultFooterText, genericErrorMsg } from "../../utils/bot/messages/basic";
import dbManager from "../../utils/database/manager";
import { URLS } from "../../utils/core/urls";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";

export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription('Cancel an active session that has already been posted.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(
            new SlashCommandStringOption()
                .setAutocomplete(true)
                .setName('session')
                .setDescription('Select the session you wish to cancel.')
                .setRequired(true)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName('reason')
                .setDescription('The reason why this session is being canceled.')
                .setRequired(false)
                .setMaxLength(100)
        )
    ,

    // Command Autocomplete:
    autocomplete: async (i: AutocompleteInteraction) => {
        // Get current text input:
        const focused = i.options.getFocused()
        // Get current sessions for guild:
        const { data, error } = await supabase.from('sessions')
            .select('id, time_zone, title, duration_ms, starts_at_utc')
            .eq('guild_id', i.guildId)
            .neq('status', 'canceled')
            .order('starts_at_utc', { ascending: false, nullsFirst: false })
            .limit(25)
        if (error || !data) return i.respond([]);
        // Filter - Cancelable:
        const cancelableSessions = data.filter(s => {
            const startBase = DateTime.fromISO(s.starts_at_utc)
            // If past start - Cannot Cancel:
            if (startBase < DateTime.utc()) return false
            else return true
        }).map(s => {
            // Get Timezone Abbreviation:
            const sessionZone = getTimeZones().find(tz => tz.name == s.time_zone)
            return {
                name: (s.title + ' - ') + DateTime.fromISO(s.starts_at_utc, { zone: s.time_zone }).toFormat(`M/d t`) + ` ${sessionZone?.abbreviation ?? ''}`,
                value: s.id
            }
        })
        // Filter by User Input - Title Search:
        const filtered = cancelableSessions
            .filter(s =>
                s.name.toLowerCase().includes(focused.toLowerCase())
            )
            .slice(0, 25)
        // Send back options:
        await i.respond(filtered)
    },

    // Command Execution:
    execute: async (i: ChatInputCommandInteraction) => {
        // Defer Reply
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Parse options:
        const selectedSessionId = i.options.getString('session', true)
        const cancelReasoning = i.options.getString('reason', false)

        const subscription = getSubscriptionFromInteraction(i)

        // Attempt to cancel:
        const result = await dbManager.sessions.cancel(i.guildId, selectedSessionId, i.user.id, cancelReasoning)

        // Build Int/Cmd Response:
        let response: ContainerBuilder
        if (result.success) {
            // Send success response:
            const startUnix = DateTime.fromISO(result?.sessionData?.starts_at_utc, { zone: 'utc' })?.toUnixInteger()
            const panelUrl = `https://discord.com/channels/${i.guildId}/${result?.sessionData?.thread_id ?? result?.sessionData?.channel_id}/${result.sessionData.panel_id}`
            response = new ContainerBuilder({
                components: <any>[
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('success')} Session Canceled \nYou have successfully canceled the following session:` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `**Title:** \n> ${result?.sessionData?.title || '?'} \n**Start Date:** \n> ${startUnix ? `<t:${startUnix}:f>` : '?'}` }),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: <any>[
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                label: 'View Session',
                                emoji: { id: core.emojis.ids.eye },
                                url: panelUrl
                            })
                        ]
                    })
                ],
                accent_color: core.colors.getOxColor('success')
            })

        } else {
            // Send failure response:
            if (result.error == 'AlreadyStarted') {
                response = new ContainerBuilder({
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('fail')} Failed to Cancel Session!` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Reason:** \n> This session has already started! Therefore, we cannot cancel its occurrence.` }),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: <any>[
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    label: 'Support Chat',
                                    emoji: { id: core.emojis.ids.chat },
                                    url: URLS.support_chat
                                })
                            ]
                        })
                    ],
                    accent_color: core.colors.getOxColor('error')
                })
            }
            else {
                // Unknown Error:
                response = new ContainerBuilder({
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('fail')} Failed to Cancel Session!` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Reason:** \n> Unknown - If this issue persists feel free to contact Bot Support.` }),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: <any>[
                                new ButtonBuilder({
                                    style: ButtonStyle.Link,
                                    label: 'Support Chat',
                                    emoji: { id: core.emojis.ids.chat },
                                    url: URLS.support_chat
                                })
                            ]
                        })
                    ],
                    accent_color: core.colors.getOxColor('error')
                })

            }


        }

        // Add Watermark - If Required:
        if (subscription.limits.SHOW_WATERMARK) {
            response.components.push(defaultFooterText({ showHelpLink: true }))
        }

        // Reply to Command Interaction:
        await i.editReply({
            components: [response],
            flags: MessageFlags.IsComponentsV2
        })

    }

}