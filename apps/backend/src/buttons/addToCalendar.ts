import { ActionRowBuilder, ButtonInteraction, ComponentType, ContainerBuilder, MessageFlags, SeparatorBuilder, StringSelectMenuBuilder, TextDisplayBuilder } from "discord.js";
import { supabase } from "../utils/database/supabase";
import core from "../utils/core";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import { defaultFooterText } from "../utils/bot/messages/basic";
import { DateTime } from "luxon";

const {
    colors: { getOxColor },
    commands,
    urls
} = core

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
            .select()
            .single()
        if (sessionError) throw sessionError;

        // Build/Send Option Menu:
        const optionMsg = new ContainerBuilder({
            accent_color: getOxColor('blue'),
            components: <any>[
                new TextDisplayBuilder({ content: `### 📅 Add Session to Calendar \n-# Please select from an available calendar format to continue.` }),
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
                                    description: 'Direct Create URL',
                                    value: 'google'
                                },
                                {
                                    label: 'Outlook Calendar',
                                    description: 'Direct Create URL',
                                    value: 'outlook'
                                },
                                {
                                    label: 'Raw ICS Format',
                                    description: 'Universal .ICS File Format',
                                    value: 'ics'
                                },
                            ]
                        })
                    ]
                })

            ]
        })

        // Add Watermark:
        if (subscription.limits.SHOW_WATERMARK) {
            optionMsg.components.push(
                new SeparatorBuilder(),
                defaultFooterText()
            )
        }

        // Send Option Menu:
        const intMsg = await i.editReply({
            components: [optionMsg],
            flags: MessageFlags.IsComponentsV2
        })

        // Create response collector:
        const replyCollector = intMsg.createMessageComponentCollector({
            idle: 60000,
            componentType: ComponentType.StringSelect,
        })

        // On Reply Collector - Interaction Collected:
        replyCollector.on('collect', async (ci) => {
            // Parse & Handle Interaction:
            const selected = ci.values?.at(-1)
            await ci.deferUpdate()

            // Get Session Dates:
            const startUtc = DateTime.fromISO(session.starts_at_utc, { zone: 'utc' })
            const endUtc = session.duration_ms
                ? DateTime.fromISO(session.starts_at_utc, { zone: 'utc' }).plus({ millisecond: session.duration_ms })
                : null
            // Util: Convert DateTime -> Cal Date Format:
            function formatDate(d: DateTime) {
                return d.toFormat(`yyyyMMdd'T'HHmmss'Z'`);
            }
            // Util: Build Google Calendar Event URL:
            const buildGoogleUrl = () => {
                const params = new URLSearchParams({
                    action: 'TEMPLATE',
                    text: session.title,
                    details: session.description ?? '',
                    location: session.url ?? '',
                    dates: endUtc
                        ? `${formatDate(startUtc)}/${formatDate(endUtc)}`
                        : `${startUtc.toFormat(`yyyyMMdd`)}/${startUtc.plus({ day: 1 }).toFormat(`yyyyMMdd`)}`,
                })
                return `https://calendar.google.com/calendar/render?${params.toString()}`
            }
            // Util: Build Outlook Calendar Event URL:
            const buildOutlookUrl = () => {
                const params = new URLSearchParams({
                    subject: session.title,
                    body: session.description ?? '',
                    location: session.url ?? '',
                    startdt: startUtc.toISO(),
                    ...(endUtc && { enddt: endUtc.toISO() })
                })
                return `https://outlook.live.com/calendar/0/deeplink/compose?${params.toString()}`
            }

            const buildICS = () => {
                return `
                    BEGIN:VCALENDAR
                    VERSION:2.0
                    PRODID:-//Sessions Bot//EN
                    CALSCALE:GREGORIAN
                    BEGIN:VEVENT
                    UID:${session.id}@sessionsbot.fyi
                    DTSTAMP:${formatDate(DateTime.now())}
                    DTSTART:${formatDate(startUtc)}
                    ${endUtc ? `DTEND:${formatDate(endUtc)}` : ''}
                    SUMMARY:${session.title}
                    DESCRIPTION:${session.description ?? ''}
                    LOCATION:${session.url ?? ''}
                    END:VEVENT
                    END:VCALENDAR
                `.trim()
            }




            const responseData = () => {
                switch (selected) {
                    case 'outlook':
                        return buildOutlookUrl()
                    case 'google':
                        return buildGoogleUrl()
                    case 'apple':
                    case 'ics':
                    default:
                        return `\`\`\`ics\n${buildICS()}\n\`\`\``
                }
            }

            await i.editReply({
                components: [
                    new ContainerBuilder({
                        accent_color: getOxColor('success'),
                        components: <any>[
                            new TextDisplayBuilder({ content: `### ✅ - Selection Received \n-# You're selected calendar format is provided below.` }),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({ content: `${responseData()}` }),
                        ]
                    })
                ]
            })

            // End the collector
            replyCollector.stop()
        })

        // On Reply Collector - End/Timeout:
        replyCollector.on('end', async (v, r) => {
            console.info('Collector Ended!', r)
            if (r == 'idle') {
                // Send Timed Out Alert:
                await i.editReply({
                    components: [
                        new ContainerBuilder({
                            accent_color: getOxColor('warning'),
                            components: <any>[
                                new TextDisplayBuilder({ content: `### ⌛ - Timed Out! \n-# Unfortunately you ran out of time to respond to this interaction. \n-# You'll have to start over and try again.` }),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder({ content: `-# [Need Help?](${urls.support.onlineResources})` }),
                            ]
                        })
                    ]
                })
            }
        })
    }
}