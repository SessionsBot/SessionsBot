import { ActionRowBuilder, AttachmentBuilder, ButtonBuilder, ButtonInteraction, ButtonStyle, ComponentType, ContainerBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import { supabase } from "../utils/database/supabase";
import core from "../utils/core/core";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import { defaultFooterText, genericErrorMsg } from "../utils/bot/messages/basic";
import { DateTime } from "luxon";
import { URLS } from "../utils/core/urls";
import { google, ics, outlook, yahoo, aol, office365, type CalendarEvent, outlookMobile, office365Mobile } from 'calendar-link'
import { useLogger } from "../utils/logs/logtail";

// Logger Util:
const createLog = useLogger()

export default {
    data: {
        customId: 'ADD_TO_CAL'
    },
    execute: async (i: ButtonInteraction) => {
        // Defer Reply
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Parse Button Id:
        const [_, sessionId] = i.customId.split(':')

        // Get Guild Subscription:
        const subscription = getSubscriptionFromInteraction(i);

        // Fetch Session Data:
        const { data: session, error: sessionError } = await supabase.from('sessions')
            .select('*')
            .eq('id', sessionId)
            .single()
        if (sessionError) throw sessionError;
        if (!session) {
            // Session NOT FOUND - Alert & Log:
            createLog.for('Database').warn('Cannot find session for "Add to Calendar" interaction!', { guildId: i?.guildId, userId: i?.user?.id, sessionId, session })
            return i.editReply({
                components: [genericErrorMsg({
                    title: `${core.emojis.string('warning')}  Error - Cannot Find Session!`,
                    reasonDesc: `It's possible this session data is no longer accessible/outdated. \n-# **Session UID**: \`${sessionId}\`\n-# Not right? Get in touch with Bot Support!`
                })]
            })
        }


        // Build & Send Calendar Option Menu:
        const optionMsg = new ContainerBuilder({
            accent_color: core.colors.getOxColor('blue'),
            components: <any>[
                new TextDisplayBuilder({ content: `## ${core.emojis.string('calendar')}  Add Session to Calendar \n> Please select from an available calendar format to continue...` }),
                new SeparatorBuilder(),
                new ActionRowBuilder({
                    components: [
                        new StringSelectMenuBuilder({
                            type: ComponentType.StringSelect,
                            custom_id: 'select-calendar',
                            options: [
                                {
                                    label: 'Apple Calendar',
                                    description: '.ICS File Format',
                                    value: 'apple'
                                },
                                {
                                    label: 'Google Calendar',
                                    description: 'Direct Creation URL',
                                    value: 'google'
                                },
                                {
                                    label: 'Outlook Calendar',
                                    description: 'Direct Creation URL',
                                    value: 'outlook'
                                },
                                {
                                    label: 'Yahoo',
                                    description: 'Direct Creation URL',
                                    value: 'yahoo'
                                },
                                {
                                    label: 'AOL',
                                    description: 'Direct Creation URL',
                                    value: 'aol'
                                },
                                {
                                    label: 'Office 365',
                                    description: 'Direct Creation URL',
                                    value: 'office365'
                                },
                                {
                                    label: 'Raw ICS Format',
                                    description: 'Universal .ICS File Format',
                                    value: 'ics'
                                },
                            ]
                        })
                    ]
                }),
                // Add Watermark - IF Plan Limits Allow:
                ...subscription?.limits?.SHOW_WATERMARK
                    ? [
                        new SeparatorBuilder(),
                        defaultFooterText()
                    ]
                    : [],

            ]
        })

        // Send Option Menu:
        const intMsg = await i.editReply({
            components: [optionMsg],
            flags: MessageFlags.IsComponentsV2
        })

        // Create response collector:
        const replyCollector = intMsg.createMessageComponentCollector({
            idle: 45_000,
            componentType: ComponentType.StringSelect,
            filter: (ci) => ci.user.id == i.user.id
        })

        // On Reply Collector - Interaction Collected:
        replyCollector.on('collect', async (ci) => {
            // Parse & Handle Interaction:
            const selected = ci.values?.at(-1)
            await ci.deferUpdate()

            // Get Session Data/Dates:
            const startUtc = DateTime.fromISO(session.starts_at_utc, { zone: 'utc' })
            const endUtc = session.duration_ms
                ? DateTime.fromISO(session.starts_at_utc, { zone: 'utc' }).plus({ millisecond: session.duration_ms })
                : DateTime.fromISO(session.starts_at_utc, { zone: 'utc' }).plus({ hour: 1 })

            const eventData: CalendarEvent = {
                uid: session?.id,
                title: session?.title,
                description: session?.description,
                start: startUtc?.toISO(),
                end: endUtc?.isValid
                    ? endUtc?.toISO()
                    : undefined,
                busy: true,
                url: session?.url ?? undefined
            }

            // Get Selected Calendar Format:
            const getCalFormat = (): {
                desktop: string,
                mobile: string | undefined,
                title: string,
                isFileFormat: boolean,
            } => {
                switch (selected) {
                    case 'outlook':
                        return {
                            desktop: outlook(eventData),
                            mobile: outlookMobile(eventData),
                            title: 'Outlook',
                            isFileFormat: false
                        }
                    case 'google':
                        return {
                            desktop: google(eventData),
                            mobile: undefined,
                            title: 'Google',
                            isFileFormat: false
                        }
                    case 'aol':
                        return {
                            desktop: aol(eventData),
                            mobile: undefined,
                            title: 'AOL',
                            isFileFormat: false
                        }
                    case 'yahoo':
                        return {
                            desktop: yahoo(eventData),
                            mobile: undefined,
                            title: 'Yahoo',
                            isFileFormat: false
                        }
                    case 'office365':
                        return {
                            desktop: office365(eventData),
                            mobile: office365Mobile(eventData),
                            title: 'Office 365',
                            isFileFormat: false
                        }
                    case 'apple':
                        return {
                            desktop: ics(eventData),
                            mobile: undefined,
                            title: 'Apple',
                            isFileFormat: true
                        }
                    case 'ics':
                    default:
                        return {
                            desktop: ics(eventData),
                            mobile: undefined,
                            title: '.ics File',
                            isFileFormat: true
                        }
                }
            }
            const calResult = getCalFormat();



            // Send Downloadable - ICS Format:
            await i.editReply({
                components: [
                    new ContainerBuilder({
                        accent_color: core.colors.getOxColor('success'),
                        components: <any>[
                            new TextDisplayBuilder({ content: `### ${core.emojis.string('success')}  Calendar Format Selected! \n> You're selected calendar format is provided below. \n> -# **Format Type**: \`${calResult?.title}\`` }),
                            // Add Creation Link Buttons - If applicable:
                            ...!calResult.isFileFormat
                                ? [
                                    new SeparatorBuilder(),
                                    new ActionRowBuilder({
                                        components: [
                                            new ButtonBuilder({
                                                style: ButtonStyle.Link,
                                                label: `Add to Calendar ${calResult?.mobile != undefined ? '(desktop)' : ''}`,
                                                emoji: {
                                                    id: core.emojis.ids.calendar
                                                },
                                                url: calResult.desktop
                                            }),
                                            ...calResult?.mobile != undefined
                                                ? [
                                                    new ButtonBuilder({
                                                        style: ButtonStyle.Link,
                                                        label: `Add to Calendar ${calResult?.mobile != undefined ? '(mobile)' : ''}`,
                                                        emoji: {
                                                            id: core.emojis.ids.calendar
                                                        },
                                                        url: calResult.mobile
                                                    })
                                                ]
                                                : []
                                        ]
                                    })
                                ]
                                : [],
                            // Add Watermark - If applicable:
                            ...subscription?.limits?.SHOW_WATERMARK
                                ? [
                                    new SeparatorBuilder(),
                                    defaultFooterText()
                                ]
                                : []
                        ]
                    })
                ]
            })
            if (calResult.isFileFormat) {
                const rawICS = decodeURIComponent(
                    calResult?.desktop?.split(",")[1]
                )
                const file = new AttachmentBuilder(
                    Buffer.from(rawICS),
                    { name: `session-${session.id}.ics` }
                )
                await i.followUp({
                    flags: MessageFlags.Ephemeral,
                    content: 'Universal Calendar Event - `.ics` format',
                    files: [file]
                })
            }




            // End the collector
            replyCollector.stop('responded')

        })


        // On Reply Collector - End/Timeout:
        replyCollector.on('end', async (v, r) => {
            if (r == 'idle') { // Send Timed Out Alert:
                await i.editReply({
                    components: [
                        new ContainerBuilder({
                            accent_color: core.colors.getOxColor('warning'),
                            components: <any>[
                                new TextDisplayBuilder({ content: `### ${core.emojis.string('timeout')} - Timed Out! \n-# Unfortunately you ran out of time to respond to this interaction. \n-# You'll have to start over and try again.` }),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder({ content: `-# [Support Resources](${URLS.site_links.support})` }),
                            ]
                        })
                    ]
                })
            } else if (r != 'responded') { // Send Unknown Error Alert - Collector Canceled:
                createLog.for('Bot').warn('Add to Calendar - Response interaction collector ended - Unknown reason!', { guildId: i?.guildId, userId: i?.user?.id, reason: r })
                await i.editReply({
                    components: [
                        genericErrorMsg({
                            title: `${core.emojis.string('warning')}  Interaction Response Collector - Failed!`,
                            reasonDesc: `It appears that while trying to record your response for a calendar format selection, We ran into an unknown error! \n-# If this issue persists, please contact [Bot Support](${URLS.support_chat})!`
                        })
                    ]
                })
            }
        })
    }
}