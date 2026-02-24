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
        .setName('cancel')
        .setDescription('Cancel an active session that is currently ongoing / already posted')
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
            .order('starts_at_utc', { ascending: false, nullsFirst: false })
            .limit(25)
        if (error || !data) return i.respond([]);
        // Filter - Cancelable:
        const cancelableSessions = data.filter(s => {
            const startBase = DateTime.fromISO(s.starts_at_utc)
            if (s.duration_ms) {
                // Check if past the end date exactly in zone:
                const endDate = startBase.plus({ milliseconds: s.duration_ms })
                return endDate > DateTime.utc()
            } else {
                // Check if past the start date day in zone:
                const endDate = startBase.setZone(s.time_zone).endOf('day')
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

        await i.deferReply({ flags: MessageFlags.Ephemeral })

        const selectedSessionId = i.options.getString('session', true)
        const cancelReasoning = i.options.getString('reason', false)
        const delayTime = i.options.getString('delay-time', false)

        // Get Session Data:
        const { data: s, error: sessionError } = await supabase.from('sessions')
            .select('*')
            .eq('id', selectedSessionId)
            .single()
        if (sessionError) throw sessionError; // Sends default failure msg
        if (!s) {
            return i.editReply({
                content: `Failed to fetch session(${selectedSessionId}) for this interaction!`,
            })
        }



        // Get "full session data" - Test:
        const { data: ss, error: session2Error } = await supabase.from('guilds')
            .select(`*, sessions(*, session_rsvp_slots(*, session_rsvps(*)))`)
            .eq('id', i.guildId)
        if (session2Error) throw session2Error; // Sends default failure msg
        if (!ss) {
            return i.editReply({
                content: `Failed to fetch session(${selectedSessionId}) for this interaction!`,
            })
        }


        // Reply to Command Interaction:
        await i.editReply({
            components: [
                new ContainerBuilder({
                    accent_color: core.colors.getOxColor('warning'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `${core.emojis.string('info')}  Command Interaction Received!` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({
                            content: `${core.emojis.string('star')}  **Option Selected:** \n> ${selectedSessionId} \n**Reason:** \n> ${cancelReasoning || 'Not Provided'} `
                        }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({
                            content: `${core.emojis.string('info')}  **Data Resp:** \n \`\`\`${JSON.stringify(ss?.splice(0, 5), null, 2)}\`\`\` `
                        }),
                    ]
                })
            ],
            flags: MessageFlags.IsComponentsV2
        })




    }

}



// .addStringOption(
//     new SlashCommandStringOption()
//         .setName('delay-time')
//         .setDescription(`Amount of time to delay session's start time. (ex: "10 mins","2 hours",etc. )(range: 5 mins-24 hrs)`)
//         .setRequired(true)
// )


// next cmd logic:
// // Parse Delay:
// const startTimeInZone = DateTime.fromISO(s.starts_at_utc, { zone: s.time_zone })
// const startRef = startTimeInZone?.toJSDate()
// const parsed = parseDate(delayTime, startRef, { forwardDate: true })
// if (!parsed) return i.editReply({
//     components: [genericErrorMsg({
//         title: `${core.emojis.string('warning')}  Invalid Delay Time!`,
//         reasonDesc: `**It seems you've entered an invalid time amount to delay this sessions start time by.** \n> Examples: \`30 mins\`, \`2 hours\`, \`5:30 pm\`, etc.`
//     })],
//     flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
// })

// const parsedDT = DateTime.fromJSDate(parsed)