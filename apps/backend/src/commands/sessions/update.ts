import { ActionRowBuilder, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, CommandData, CommandInteraction, ComponentType, ContainerBuilder, InteractionContextType, LabelBuilder, MessageFlags, ModalBuilder, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, StringSelectMenuInteraction, TextDisplayBuilder } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import core from "../../utils/core/core";
import { defaultFooterText, genericErrorMsg } from "../../utils/bot/messages/basic";
import { URLS } from "../../utils/core/urls";
import { updateExistingSessionPanel } from "../../utils/bot/messages/sessionPanels";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import { useLogger } from "../../utils/logs/logtail";

// Logger Util:
const createLog = useLogger();

export default <CommandData>{
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('update')
        .setDescription('Update/refresh a recently posted Session Panel.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
        .setContexts(InteractionContextType.Guild)
    ,
    // Command Cooldown:
    cooldown: 10,
    // Command Execution:
    execute: async (i: ChatInputCommandInteraction) => {
        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Guild Subscription:
        const guildSubscription = getSubscriptionFromInteraction(i)

        // Get Updatable Sessions:
        const getUpdatableSessions = async () => {
            const { data: sessions, error } = await supabase.from('sessions')
                .select('id, time_zone, title, duration_ms, starts_at_utc')
                .eq('guild_id', i.guildId)
                .order('starts_at_utc', { ascending: false, nullsFirst: false })
                .limit(25)
            if (error) throw error;
            // Filter - Updatable:
            const updatableSessions = sessions?.filter(s => {
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
                const startInZone = DateTime.fromISO(s.starts_at_utc, { zone: s.time_zone })
                return {
                    label: (s.title + ' - ') + startInZone?.toFormat(`M/d t`) + ` ${startInZone?.offsetNameShort ?? ''}`,
                    value: s.id
                }
            })
            return updatableSessions
        }
        const sessions = await getUpdatableSessions()

        // If No Updatable Sessions Found - Send/Return Alert:
        if (!sessions || !sessions?.length) return await i.reply({
            components: [new ContainerBuilder({
                accent_color: core.colors.getOxColor('blue'),
                components: <any>[
                    new TextDisplayBuilder({ content: `### ${core.emojis.string('info')} No Updatable Sessions Found...` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `**Details:**\n> It appears you don't have any recently posted \`Session Panels\` available to be updated!` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `-# **TIP:** Create a new session/event on your [Bot Dashboard](${URLS.site_links.dashboard}). \n-# [Need Help?](${URLS.support_chat})` })
                ]
            })],
            flags: MessageFlags.IsComponentsV2
        })

        // Send Selection Msg & Await Response:
        const choiceMsg = await i.editReply({
            components: [new ContainerBuilder({
                accent_color: core.colors.getOxColor('blue'),
                components: <any>[
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('help')}  Update Session - Selection:` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `Select a posted session to update: \n> -# Trying to modify a session schedule? Visit your [Bot Dashboard](${URLS.site_links.dashboard}).` }),
                    new ActionRowBuilder({
                        components: [
                            new StringSelectMenuBuilder({
                                custom_id: 'update-selected-id',
                                placeholder: 'Select a session...',
                                options: [...sessions]
                            })
                        ]
                    })
                ]
            })],
            flags: MessageFlags.IsComponentsV2
        })

        // Await Response / Selection:
        const collector = choiceMsg.createMessageComponentCollector({
            filter: (n) => i.user?.id == n.user.id,
            idle: 30_000,
        })

        // On Collector Response:
        collector.on('collect', async (ni: StringSelectMenuInteraction) => {
            try {
                const selected = ni?.values
                await ni.deferUpdate()

                // Confirm selected id:
                const selectedId = selected?.at(-1)
                if (!selectedId) {
                    collector.stop('errored')
                    return await i.editReply({
                        components: [genericErrorMsg({
                            reasonDesc: `Invalid/missing session (id) to update? Please try again and select a valid session!`
                        })]
                    })
                }

                // Update Session Panel:
                // Get Full Session Data:
                const { data: guildData, error: guildDataError } = await supabase.from('guilds')
                    .select(`accent_color, calendar_button, sessions(*, session_rsvp_slots(*, session_rsvps(*)))`)
                    .eq('id', i.guildId)
                    .eq('sessions.id', selectedId)
                    .single()
                const fullSessionData = guildData?.sessions?.[0]
                if (guildDataError || !fullSessionData) {
                    // Data Fetch Err - Alert:
                    createLog.for('Bot').warn(`Failed to find a session for /update cmd interaction!`, { userId: i?.user?.id, guildId: i?.guildId, selectedId, guildDataError, fullSessionData })
                    collector.stop('errored')
                    return await i?.editReply({
                        components: [genericErrorMsg({
                            reasonDesc: `It seems like we can't find the session you've selected to update! If this issue persists, please get in contact with bot support!`
                        })]
                    })
                }
                const update = await updateExistingSessionPanel(
                    fullSessionData,
                    guildSubscription?.limits?.SHOW_WATERMARK,
                    guildData?.accent_color,
                    guildData?.calendar_button
                )
                if (!update.success) {
                    // Alert - Update Error:
                    collector.stop('errored')
                    return await i?.editReply({
                        components: [genericErrorMsg({
                            reasonDesc: `It seems like we ran into an error while updating the session you selected to update! If this issue persists, please get in contact with bot support!`
                        })]
                    })
                } else {
                    // Alert - Update Successful:
                    collector.stop('success')
                    return await i?.editReply({
                        components: [new ContainerBuilder({
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
                                            url: `https://discord.com/channels/${i?.guildId}/${fullSessionData?.thread_id ?? fullSessionData?.channel_id}/${fullSessionData?.panel_id}`,
                                            emoji: { name: 'eye', id: core.emojis.ids.eye },
                                            label: `View Session Panel`
                                        })
                                    ]
                                }),
                                ...[(guildSubscription?.limits?.SHOW_WATERMARK)
                                    ? [
                                        new SeparatorBuilder(),
                                        defaultFooterText({ lightFont: true })
                                    ]
                                    : []
                                ].flat()
                            ]
                        })],
                        flags: MessageFlags.IsComponentsV2
                    })
                }

            } catch (err) {
                collector.stop('errored')
                throw err
            }
        })


        // On Collector End/Timeout:
        collector.on('end', async (is, r) => {
            try {
                if (r == 'idle') {
                    // Send timed out alert:
                    return await i?.editReply({
                        components: [new ContainerBuilder({
                            accent_color: core.colors.getOxColor('warning'),
                            components: <any>[
                                new TextDisplayBuilder({ content: `### ${core.emojis.string('timeout')}  Interaction Timed Out!` }),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder({ content: `**Details:** \n> Unfortunately, you ran out of time to respond to this interaction... you'll have to start over to try again!` })
                            ]
                        })]
                    })
                }
            } catch (err) {
                return createLog.for('Bot').warn('Failed to notify of collector ended - /update cmd interaction', { userId: i?.user?.id, guildId: i?.guildId, err, end_reason: r })
            }
        })

    }

}