import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, CommandInteraction, ComponentType, ContainerBuilder, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, SlashCommandStringOption, TextDisplayBuilder } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import core from "../../utils/core/core";
import { getTimeZones } from '@vvo/tzdb'
import { defaultFooterText, genericErrorMsg } from "../../utils/bot/messages/basic";
import { URLS } from "../../utils/core/urls";
import { updateExistingSessionPanel } from "../../utils/bot/messages/sessionPanels";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import { useLogger } from "../../utils/logs/logtail";

// Logger Util:
const createLog = useLogger();

export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update/refresh a recently posted Session Panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .addStringOption(
            new SlashCommandStringOption()
                .setAutocomplete(true)
                .setName('session')
                .setDescription('Select the session you wish to cancel.')
                .setRequired(true)
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
            .order('starts_at_utc', { ascending: false, nullsFirst: false })
            .limit(25)
        if (error || !data) return i.respond([]);
        // Filter - Cancelable:
        const cancelableSessions = data.filter(s => {
            const startBase = DateTime.fromISO(s.starts_at_utc, { zone: 'utc' })
            if (s.duration_ms) {
                // Check if past the end date exactly in zone:
                const endDate = startBase.plus({ milliseconds: s.duration_ms })
                return endDate > DateTime.utc()
            } else {
                // Check if past the start date day in zone + (24 hrs):
                const endDate = startBase.setZone(s.time_zone).plus({ hour: 24 })
                return endDate > DateTime.now().setZone(s.time_zone)
            }
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
        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Get Selected Session:
        const selectedSessionId = i.options.getString('session', true)

        // Guild Subscription:
        const guildSubscription = getSubscriptionFromInteraction(i)

        // Get Full Session Data:
        const { data: guildData, error: guildDataError } = await supabase.from('guilds')
            .select(`accent_color, calendar_button, sessions(*, session_rsvp_slots(*, session_rsvps(*)))`)
            .eq('id', i.guildId)
            .eq('sessions.id', selectedSessionId)
            .single()
        const sessionData = guildData.sessions?.[0]
        if (guildDataError) throw guildDataError; // Sends default failure msg
        if (!guildData || !sessionData) {
            createLog.for('Database').error('Failed to fetch a session for updating panel! - See details...', { guildData, sessionData, guildDataError, guildId: i.guildId })
            return await i.editReply({
                components: <any>[
                    genericErrorMsg({
                        title: `${core.emojis.string('warning')} Failed to update Session Panel!`,
                        reasonDesc: `Unfortunately we were unable to find the requested session you're trying to refresh. If you believe this is an error please get in contact with [Bot Support](${URLS.support_chat}). `
                    })
                ]
            })
        }

        // Update Session Panel:
        const update = await updateExistingSessionPanel(
            sessionData,
            guildSubscription.limits.SHOW_WATERMARK,
            guildData.accent_color,
            guildData.calendar_button
        )


        // Build Command Interaction Response:
        let response: ContainerBuilder
        if (!update.success) {
            // Failed to Update - Alert:
            response = new ContainerBuilder({
                accent_color: core.colors.getOxColor('error'),
                components: <any>[
                    genericErrorMsg({
                        title: `${core.emojis.string('warning')} Failed to update Session Panel!`,
                        reasonDesc: `Unfortunately we were unable to update requested session panel you're trying to refresh. If you believe this is an error please get in contact with [Bot Support](${URLS.support_chat}). `
                    })
                ]
            })
        } else {
            // Updated Successfully - Alert:
            response = new ContainerBuilder({
                accent_color: core.colors.getOxColor('success'),
                components: <any>[
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('success')}  Update Success!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `**Details**: \n> You're session panel has been updated, click the button below to view any changes. \n-# Trying to modify a session schedule? Visit your [Bot Dashboard](${URLS.site_links.dashboard}).` }),
                    new SeparatorBuilder(),
                    new ActionRowBuilder({
                        components: [
                            new ButtonBuilder({
                                style: ButtonStyle.Link,
                                url: `https://discord.com/channels/${i?.guildId}/${sessionData?.thread_id ?? sessionData?.channel_id}/${sessionData?.panel_id}`,
                                emoji: { name: 'eye', id: core.emojis.ids.eye },
                                label: `View Session Panel`
                            })
                        ]
                    })
                ]
            })
        }

        // If SHOW WATERMARK - Add to Response:
        if (guildSubscription.limits.SHOW_WATERMARK) {
            response.components.push(
                new SeparatorBuilder(),
                defaultFooterText({ showHelpLink: true })
            )
        }

        // Response to Command Interaction:
        await i.editReply({
            components: [
                response
            ],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        })

    }

}