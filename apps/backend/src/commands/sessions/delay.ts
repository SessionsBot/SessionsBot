import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, CommandInteraction, ComponentType, ContainerBuilder, MessageFlags, PermissionFlagsBits, SelectMenuOptionBuilder, SeparatorBuilder, SlashCommandBuilder, SlashCommandStringOption, TextDisplayBuilder, TextDisplayComponent } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import core from "../../utils/core/core";
import { getTimeZones } from '@vvo/tzdb'
import { parseDate } from "chrono-node";
import { defaultFooterText, genericErrorMsg } from "../../utils/bot/messages/basic";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import dbManager from "../../utils/database/manager";

export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('delay')
        .setDescription(`Delay a session that has not yet started but has been posted.`)
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
                .setName('delay-time')
                .setDescription('The amount of time to delay session start by. (e.g. "in 2 hours","5 mins","12 pm")')
                .setRequired(true)
                .setMaxLength(100)
        )
        .addStringOption(
            new SlashCommandStringOption()
                .setName('reason')
                .setDescription('The reason why this session is being delayed.')
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
            // If past start - Cannot Delay:
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

        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Parse Cmd Options:
        const selectedSessionId = i.options.getString('session', true)
        const delayReasoning = i.options.getString('reason', false)
        const delayTime = i.options.getString('delay-time', false)

        // Guild Subscription:
        const subscription = getSubscriptionFromInteraction(i)


        // Get "Full Session Data":
        const { data: dbData, error: dbDataErr } = await supabase.from('guilds')
            .select(`*, sessions!inner(*, session_rsvp_slots(*, session_rsvps(*)))`)
            .eq('id', i.guildId)
            .eq('sessions.id', selectedSessionId)
            .maybeSingle()
        const sessionData = dbData.sessions?.[0]
        if (dbDataErr) throw dbDataErr; // Sends default failure msg
        if (!dbData || !sessionData) {
            return i.editReply({
                components: [genericErrorMsg({
                    title: 'Failed to find Session!',
                    reasonDesc: `Unfortunately we couldn't find the session you're trying to delay... If this issue persist please get in contact with Bot Support!`
                }),],
                flags: MessageFlags.IsComponentsV2
            })
        }
        const panelUrl = `https://discord.com/channels/${i?.guildId}/${sessionData?.thread_id ?? sessionData?.channel_id}/${sessionData?.panel_id}`;


        // Parse Delay:
        const startTimeInZone = DateTime.fromISO(sessionData?.starts_at_utc, { zone: sessionData?.time_zone })
        const startRef = startTimeInZone?.toJSDate()
        const parsed = parseDate(delayTime, startRef, { forwardDate: true })
        if (!parsed) return i.editReply({
            components: [genericErrorMsg({
                title: `${core.emojis.string('warning')}  Invalid Delay Time!`,
                reasonDesc: `**It seems you've entered an invalid time amount to delay this sessions start time by.** \n> Examples: \`30 mins\`, \`2 hours\`, \`5:30 pm\`, etc. \n-# Use the ${core.commands.getLinkString('delay')} command to try again.`
            })],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        })
        const parsedDT = DateTime.fromJSDate(parsed)

        // Check for Past New Date - Not Allowed:
        if (parsedDT <= startTimeInZone || parsedDT <= DateTime.utc()) {
            return i.editReply({
                components: [genericErrorMsg({
                    title: `${core.emojis.string('warning')}  Invalid Delay Time!`,
                    reasonDesc: `The new start time must be **after the current session start time** and in the future! \n-# Use the ${core.commands.getLinkString('delay')} command to try again.`
                })],
                flags: MessageFlags.IsComponentsV2
            })
        }

        // Send Response - Ask for Confirmation:
        const initResponse = await i.editReply({
            components: [
                new ContainerBuilder({
                    accent_color: core.colors.getOxColor('success'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('help')}  Confirm - Delay Session` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Session Name:** \n> [${sessionData?.title}](${panelUrl}) \n**Original Start:** \n> <t:${startTimeInZone?.toUnixInteger()}:f> \n**New Start:** \n> <t:${parsedDT?.toUnixInteger()}:f>` }),
                        new SeparatorBuilder(),
                        new ActionRowBuilder({
                            components: [
                                new ButtonBuilder({
                                    style: ButtonStyle.Secondary,
                                    label: 'Cancel',
                                    emoji: { id: core.emojis.ids.fail },
                                    custom_id: 'DELAY_CANCEL'
                                }),
                                new ButtonBuilder({
                                    style: ButtonStyle.Success,
                                    label: 'Confirm',
                                    emoji: { id: core.emojis.ids.success },
                                    custom_id: 'DELAY_CONFIRM'
                                })
                            ]
                        })
                    ]
                })
            ],
            flags: MessageFlags.IsComponentsV2
        })


        // Set/Start Interaction Collector:
        const collector = initResponse.createMessageComponentCollector({
            idle: 20_000,
            filter: (c) => c.user.id == i.user.id,
            componentType: ComponentType.Button,
        })

        collector.on('collect', async (ni) => {

            if (ni.customId == 'DELAY_CONFIRM') {
                // Attempt Delay:
                const result = await dbManager.sessions.delay(i.guildId, sessionData.id, parsedDT.toUTC(), i.user.id, delayReasoning)
                if (result.success) {
                    // Send Success Message:
                    await ni.update({
                        components: <any>[
                            new ContainerBuilder({
                                accent_color: core.colors.getOxColor('success'),
                                components: <any>[
                                    new TextDisplayBuilder({ content: `## ${core.emojis.string('success')}  Delay Session - Confirmed` }),
                                    new SeparatorBuilder(),
                                    new TextDisplayBuilder({ content: `**Title:** \n> ${result.sessionData?.title} \n**New Start:** \n> <t:${DateTime.fromISO(result.sessionData?.starts_at_utc, { zone: 'utc' })?.toUnixInteger()}:f> ` }),
                                    new TextDisplayBuilder({ content: `-# To delay a different session use the ${core.commands.getLinkString('delay')} command!` }),
                                    new SeparatorBuilder(),
                                    new ActionRowBuilder({
                                        components: [
                                            new ButtonBuilder({
                                                style: ButtonStyle.Link,
                                                label: 'View Session',
                                                emoji: { id: core.emojis.ids.eye },
                                                url: panelUrl
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                    collector.stop('confirmed')
                } else throw { message: 'Failed to delay session from cmd interaction', result }

            } else {
                // Send Canceled Message:
                await ni.update({
                    components: <any>[
                        new ContainerBuilder({
                            accent_color: core.colors.getOxColor('error'),
                            components: <any>[
                                new TextDisplayBuilder({ content: `## ${core.emojis.string('fail')}  Delay Session - Canceled` }),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder({ content: `**Details:** \n> This interaction has been canceled!` }),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder({ content: `-# To delay a different session use the ${core.commands.getLinkString('delay')} command!` }),
                            ]
                        })
                    ]
                })
                collector.stop('canceled')
            }
        })



        // Collector Timeout:
        collector.on('end', async (ei, r) => {
            if (r != 'idle') return;
            if (i.replied || i.reply)
                await i.editReply({
                    components: [
                        new ContainerBuilder({
                            accent_color: core.colors.getOxColor('error'),
                            components: <any>[
                                new TextDisplayBuilder({ content: `### ${core.emojis.string('timeout')}  Interaction Timed Out!` }),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder({ content: `**Details:** \n> You'll have to start this interaction over again to continue...` }),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder({ content: `-# To try again use the ${core.commands.getLinkString('delay')} command.` }),
                                ...(subscription.limits.SHOW_WATERMARK ? [
                                    defaultFooterText({ showHelpLink: true, lightFont: true })
                                ] : []),
                            ]
                        })
                    ]
                })
        })


    }

}
