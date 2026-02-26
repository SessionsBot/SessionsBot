import { AutocompleteInteraction, ChatInputCommandInteraction, CommandInteraction, ContainerBuilder, MessageFlags, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, SlashCommandStringOption, TextDisplayBuilder } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import core from "../../utils/core/core";
import { getTimeZones } from '@vvo/tzdb'
import { parse, parseDate } from "chrono-node";
import { genericErrorMsg } from "../../utils/bot/messages/basic";

export default {
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('delay')
        .setDescription(`Delay a session that hasn't started but has already been already posted`)
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

        await i.deferReply({ flags: MessageFlags.Ephemeral })

        const selectedSessionId = i.options.getString('session', true)
        const cancelReasoning = i.options.getString('reason', false)
        const delayTime = i.options.getString('delay-time', false)

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

        // Parse Delay:
        const startTimeInZone = DateTime.fromISO(sessionData?.starts_at_utc, { zone: sessionData?.time_zone })
        const startRef = startTimeInZone?.toJSDate()
        const parsed = parseDate(delayTime, startRef, { forwardDate: true })
        if (!parsed) return i.editReply({
            components: [genericErrorMsg({
                title: `${core.emojis.string('warning')}  Invalid Delay Time!`,
                reasonDesc: `**It seems you've entered an invalid time amount to delay this sessions start time by.** \n> Examples: \`30 mins\`, \`2 hours\`, \`5:30 pm\`, etc.`
            })],
            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
        })

        const parsedDT = DateTime.fromJSDate(parsed)


        // Reply to Command Interaction:
        await i.editReply({
            components: [
                new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `${core.emojis.string('info')}  Command Interaction Received!` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({
                            content: `${core.emojis.string('star')}  **Option Selected:** \n> ${selectedSessionId} \n**Delay Time:** \n> ${delayTime || 'Not Provided'} \n**Reason:** \n> ${cancelReasoning || 'Not Provided'} `
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({
                            content: `${core.emojis.string('info')}  **New Start:** \n <t:${parsedDT.toUnixInteger()}:F> `
                        }),
                    ]
                })
            ],
            flags: MessageFlags.IsComponentsV2
        })




    }

}
