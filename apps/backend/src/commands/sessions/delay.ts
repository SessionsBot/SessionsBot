import { ActionRowBuilder, APISelectMenuOption, ButtonBuilder, ButtonInteraction, ButtonStyle, ChatInputCommandInteraction, CommandData, ComponentType, ContainerBuilder, LabelBuilder, MessageFlags, ModalBuilder, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, StringSelectMenuBuilder, StringSelectMenuInteraction, TextDisplayBuilder, TextInputStyle } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import core from "../../utils/core/core";
import { parseDate } from "chrono-node";
import { defaultFooterText, genericErrorMsg } from "../../utils/bot/messages/basic";
import { AuditEvent, FullSessionData, getSubscriptionFromInteraction } from "@sessionsbot/shared";
import { URLS } from "../../utils/core/urls";
import { useLogger } from "../../utils/logs/logtail";
import { updateExistingSessionPanel } from "../../utils/bot/messages/sessionPanels";
import { createAuditLog } from "../../utils/database/auditLog";

const createLog = useLogger()

export default <CommandData>{
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('delay')
        .setDescription(`Delay a session that has not yet started but has been posted.`)
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    ,
    // Command Cooldown:
    cooldown: 10,
    // Command Execution:
    execute: async (i: ChatInputCommandInteraction) => {

        // Defer Reply:
        await i.deferReply({ flags: MessageFlags.Ephemeral })

        // Guild Subscription:
        const subscription = getSubscriptionFromInteraction(i)

        // Get Guild Data - Active/Recently Posted Sessions:
        const { data: guild, error: guildError } = await supabase
            .from('guilds')
            .select('*')
            .eq('id', i.guildId)
            .single()

        const { data: delayableSessions, error: sessionsError } = await supabase
            .from('sessions')
            .select(`*, session_rsvp_slots(*, session_rsvps(*))`)
            .eq('guild_id', i.guildId)
            .neq('status', 'canceled')
            .gt('starts_at_utc', DateTime.utc().toISO())
            .order('starts_at_utc', { ascending: false })
            .limit(25)
        if (guildError || sessionsError || !guild) throw { guildError, sessionsError, guildId: i?.guildId }; // Sends default failure msg


        // Send No Available Sessions Message:
        if (!delayableSessions?.length) {
            return i?.editReply({
                flags: MessageFlags.IsComponentsV2,
                components: [new ContainerBuilder({
                    accent_color: core.colors.getOxColor('blue'),
                    components: <any>[
                        new TextDisplayBuilder({ content: `### ${core.emojis.string('info')} No Delayable Sessions Found...` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `**Details:**\n> It appears you don't have any recently posted \`Sessions\` available to be delayed!` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `-# **TIP:** Create a new session/event on your [Bot Dashboard](${URLS.site_links.dashboard}). \n-# [Need Help?](${URLS.support_chat})` })
                    ]
                })]
            })
        }

        // Send Session Selection Message:
        const sessionOptions = delayableSessions?.map(s => {
            const startInZone = DateTime.fromISO(s.starts_at_utc, { zone: s.time_zone })
            return <APISelectMenuOption>{
                label: `${s.title} - ${startInZone?.toFormat(`M/d/y t`) ?? '?'} ${startInZone?.offsetNameShort ?? ''}`,
                value: s.id,
            }
        })
        const choiceMsg = await i?.editReply({
            flags: MessageFlags.IsComponentsV2,
            components: [new ContainerBuilder({
                accent_color: core.colors.getOxColor('warning'),
                components: <any>[
                    new TextDisplayBuilder({ content: `## ${core.emojis.string('help')}  Delay Session - Selection:` }),
                    new SeparatorBuilder(),
                    new TextDisplayBuilder({ content: `Select a posted session to delay: \n> -# Trying to modify a session schedule? Visit your [Bot Dashboard](${URLS.site_links.dashboard}).` }),
                    new ActionRowBuilder({
                        components: [
                            new StringSelectMenuBuilder({
                                custom_id: 'delay-session-selected',
                                placeholder: 'Select a session...',
                                options: [...sessionOptions]
                            })
                        ]
                    })
                ]
            })]
        })

        // Await Response / Selection:
        const collector = choiceMsg.createMessageComponentCollector({
            filter: (n) => (i.user?.id == n.user.id),
            idle: 60_000,
        })

        let selectedId: string | undefined = undefined;
        let sessionData: typeof delayableSessions[number] | undefined = undefined;
        let delayInMins: number | undefined = undefined;

        // On Collector Response:
        collector.on('collect', async (ni: StringSelectMenuInteraction | ButtonInteraction) => {
            try {

                const customId = ni?.customId

                // Defer update:
                if (customId != 'delay-time:custom') {
                    await ni?.deferUpdate()
                }

                // Selected Session to Delay - Sent Delay Time Options:
                if (customId == 'delay-session-selected' && ni.isStringSelectMenu()) {
                    selectedId = ni.values?.[0]
                    sessionData = delayableSessions?.find(s => s?.id == selectedId)
                    if (!selectedId || !sessionData) {
                        collector.stop('errored')
                        return i?.editReply({
                            components: [genericErrorMsg({
                                reasonDesc: `Failed to find selected session? If this issue persists, please get in contact bot support!`
                            })]
                        })
                    }
                    // Send Delay Time Selection Msg:
                    const currentStartInZone = DateTime.fromISO(sessionData?.starts_at_utc, { zone: sessionData?.time_zone })
                    await i?.editReply({
                        components: [
                            new ContainerBuilder({
                                accent_color: core.colors.getOxColor('warning'),
                                components: <any>[
                                    new TextDisplayBuilder({ content: `## ${core.emojis.string('help')} Session - Delay Amount:` }),
                                    new SeparatorBuilder(),
                                    new TextDisplayBuilder({ content: `**Session Selected:** \n> ${sessionData?.title} \n**Current Start:** \n> ${currentStartInZone?.isValid ? `<t:${currentStartInZone?.toUnixInteger()}:f>` : 'UNKNOWN?'}` }),
                                    new SeparatorBuilder(),
                                    new TextDisplayBuilder({ content: `**Select a Delay Amount:**` }),
                                    new ActionRowBuilder({
                                        components: [
                                            new ButtonBuilder({
                                                customId: 'delay-time:10',
                                                style: ButtonStyle.Secondary,
                                                label: '10 mins',
                                                emoji: { id: core.emojis.ids.clock }
                                            }),
                                            new ButtonBuilder({
                                                customId: 'delay-time:30',
                                                style: ButtonStyle.Secondary,
                                                label: '30 mins',
                                                emoji: { id: core.emojis.ids.clock }
                                            }),
                                            new ButtonBuilder({
                                                customId: 'delay-time:60',
                                                style: ButtonStyle.Secondary,
                                                label: '1 hour',
                                                emoji: { id: core.emojis.ids.clock }
                                            }),
                                            new ButtonBuilder({
                                                customId: 'delay-time:custom',
                                                style: ButtonStyle.Secondary,
                                                label: 'Custom',
                                                emoji: { id: core.emojis.ids.star }
                                            })
                                        ]
                                    })
                                ]
                            })
                        ]
                    })
                }

                // Selected Session Delay Time Option - Confirm/Modal:
                else if (customId?.includes(`delay-time`)) {
                    const ctx = customId?.split(`delay-time:`)?.[1]
                    const currentStartInZone = DateTime.fromISO(sessionData?.starts_at_utc, { zone: sessionData?.time_zone })
                    // Rejecting Delay Time:
                    if (ctx == 'cancel') {
                        collector.stop('canceled')
                        return await i?.editReply({
                            components: [new ContainerBuilder({
                                accent_color: core.colors.getOxColor('warning'),
                                components: <any>[
                                    new TextDisplayBuilder({ content: `### ${core.emojis.string('fail')}  Rejected Delay Time` }),
                                    new SeparatorBuilder(),
                                    new TextDisplayBuilder({ content: `> If you'd like to still delay a session, restart this interaction with the ${core.commands.string('delay')} command.` }),
                                    new SeparatorBuilder(),
                                    new TextDisplayBuilder({ content: `-# [Need Help?](${URLS.support_chat})` }),
                                ]
                            })]
                        })
                    }
                    // Confirming Delay Time:
                    else if (ctx == 'confirm') {
                        try {
                            const newStartInZone = currentStartInZone?.plus({ minutes: delayInMins })
                            const panelUrl = `https://discord.com/channels/${i?.guildId}/${sessionData?.thread_id ?? sessionData?.channel_id}/${sessionData?.panel_id}`;

                            // Save New Session Start to DB:
                            const { error } = await supabase.from('sessions').update({
                                id: sessionData?.id,
                                status: 'delayed',
                                starts_at_utc: newStartInZone?.toUTC()?.toISO()
                            }).eq('id', sessionData?.id)
                            if (error) throw error
                            // Update Session Panel:
                            const fullSessionData = <FullSessionData>{
                                ...sessionData,
                                status: 'delayed',
                                starts_at_utc: newStartInZone?.toUTC()?.toISO()
                            }
                            const updateMsg = await updateExistingSessionPanel(fullSessionData, subscription?.limits?.SHOW_WATERMARK, guild?.accent_color, guild?.calendar_button)
                            if (!updateMsg.success) throw { msg: `Failed updating sessions panel from /delay interaction!`, updateMsg }

                            // Create Audit Log:
                            createAuditLog({
                                event: AuditEvent.SessionDelayed,
                                guild: i?.guildId,
                                user: i?.user?.id,
                                meta: {
                                    session_id: sessionData?.id,
                                    reason: null
                                }
                            })

                            // Send Success Alert:
                            await i?.editReply({
                                components: <any>[new ContainerBuilder({
                                    accent_color: core.colors.getOxColor('success'),
                                    components: <any>[
                                        new TextDisplayBuilder({ content: `## ${core.emojis.string('success')}  Success - Session Delayed` }),
                                        new SeparatorBuilder(),
                                        new TextDisplayBuilder({ content: `**Session Title:**\n> ${sessionData?.title ?? '?'} \n**New Start:**\n> <t:${newStartInZone?.toUnixInteger()}:f>` }),
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
                                        }),
                                        ...[subscription?.limits?.SHOW_WATERMARK ? [
                                            new SeparatorBuilder(),
                                            defaultFooterText({ lightFont: true })
                                        ] : []].flat()
                                    ]
                                })]
                            })
                            return collector.stop('succeeded!')
                        } catch (error) {
                            // Error - Confirmed/Saving new session start date to db/update:
                            collector.stop('errored')
                            createLog.for('Bot').error('FAILED to save/update a confirm session delayed start time!', { userId: i?.user?.id, guildId: i?.guildId, error })
                            throw error
                        }
                    }
                    // Delay by set minuet:
                    else if (['10', '30', '60'].includes(ctx)) {
                        delayInMins = Number(ctx)
                        // Send Confirmation - New Start Date:
                        await i?.editReply({
                            components: [new ContainerBuilder({
                                accent_color: core.colors.getOxColor('warning'),
                                components: <any>[
                                    new TextDisplayBuilder({ content: `## ${core.emojis.string('help')} Session Delay Time - Confirm` }),
                                    new SeparatorBuilder(),
                                    new TextDisplayBuilder({ content: `**Details:**\n> Please confirm the session's new start time! \n**Session Title:**\n> ${sessionData?.title} \n**Original Start:**\n> <t:${currentStartInZone?.toUnixInteger()}:f> \n**New Start:**\n> <t:${currentStartInZone?.plus({ minutes: delayInMins ?? 0 })?.toUnixInteger()}:f>` }),
                                    new ActionRowBuilder({
                                        components: [
                                            new ButtonBuilder({
                                                label: `Cancel`,
                                                emoji: { id: core.emojis.ids.fail },
                                                customId: 'delay-time:cancel',
                                                style: ButtonStyle.Secondary
                                            }),
                                            new ButtonBuilder({
                                                label: `Confirm`,
                                                emoji: { id: core.emojis.ids.success },
                                                customId: 'delay-time:confirm',
                                                style: ButtonStyle.Secondary
                                            })
                                        ]
                                    })
                                ]
                            })]
                        })
                    }
                    // Custom Delay Time Interactions:
                    else if (ctx == 'custom') {
                        // Build & Send Modal:
                        const customModal = new ModalBuilder({
                            title: 'Delay Time - Custom',
                            customId: 'delay-time:custom',
                            components: [
                                {
                                    type: ComponentType.TextDisplay,
                                    content: '**Enter either:**\n>>> - A `Date` to delay the session start to *(must be in future).* \n- A `Time Amount` to delay the sessions start time from.'
                                },
                                new LabelBuilder({
                                    label: 'Delay Time or Date',
                                    component: {
                                        type: ComponentType.TextInput,
                                        custom_id: 'custom-input',
                                        style: TextInputStyle.Short,
                                        placeholder: `Ex: "11/11 4pm", "5 pm", "45 mins", etc.`
                                    }
                                })
                            ]
                        })
                        try {
                            // Show & Await Modal Submission:
                            await ni.showModal(customModal)
                            const modalSubmit = await ni.awaitModalSubmit({
                                time: 60_000
                            }).catch((err) => {
                                if (err?.code === 'InteractionCollectorError') return;
                                throw err;
                            });
                            if (!modalSubmit || !modalSubmit?.fields) {
                                collector.stop('modal-fail')
                                return await i.editReply({
                                    components: [genericErrorMsg({
                                        reasonDesc: `Failed to receive "Custom Time" modal submission! \nStart the interaction over with the ${core.commands.string('delay')} command.`
                                    })]
                                })
                            }
                            collector.resetTimer({})
                            // Process Modal Submission:
                            await modalSubmit.deferUpdate().catch((e) => { })
                            const field = modalSubmit.fields.fields.get('custom-input')
                            const inputTime = field.type == ComponentType.TextInput ? field.value : 'null';

                            // Parse Input Delay:
                            const parsed = parseDate(inputTime, currentStartInZone?.toJSDate(), { forwardDate: true })
                            if (!parsed) return await i.editReply({
                                components: [genericErrorMsg({
                                    title: `${core.emojis.string('warning')}  Invalid Delay Time!`,
                                    reasonDesc: `**It seems you've entered an invalid time amount to delay this sessions start time by.** \n> Examples: \`30 mins\`, \`2 hours\`, \`11/11 at 5 pm\`, etc. \n-# Use the ${core.commands.string('delay')} command to try again.`
                                })],
                                flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                            })
                            const parsedDT = DateTime.fromJSDate(parsed)

                            // Check for Past New Date - Not Allowed:
                            if (parsedDT <= currentStartInZone) {
                                collector.stop('invalid-input')
                                return await i.editReply({
                                    components: [genericErrorMsg({
                                        title: `${core.emojis.string('warning')}  Invalid Delay Time!`,
                                        reasonDesc: `The new start time must be **after the current session start time**! \n**Current Start Date:**:\n> <t:${currentStartInZone?.toUnixInteger()}:f> \n-# Use the ${core.commands.string('delay')} command to try again.`
                                    })],
                                    flags: MessageFlags.IsComponentsV2
                                })
                            }

                            // Calc - Delay in Mins from ParsedDT:
                            const mins = parsedDT.diff(currentStartInZone, 'minutes')?.minutes
                            delayInMins = mins ?? 0

                            // Send Confirmation - New Start Date:
                            await i?.editReply({
                                components: [new ContainerBuilder({
                                    accent_color: core.colors.getOxColor('warning'),
                                    components: <any>[
                                        new TextDisplayBuilder({ content: `## ${core.emojis.string('help')} Session Delay Time - Confirm` }),
                                        new SeparatorBuilder(),
                                        new TextDisplayBuilder({ content: `**Details:**\n> Please confirm the session's new start time! \n**Session Title:**\n> ${sessionData?.title} \n**Original Start:**\n> <t:${currentStartInZone?.toUnixInteger()}:f> \n**New Start:**\n> <t:${parsedDT?.toUnixInteger()}:f>` }),
                                        new ActionRowBuilder({
                                            components: [
                                                new ButtonBuilder({
                                                    label: `Cancel`,
                                                    emoji: { id: core.emojis.ids.fail },
                                                    customId: 'delay-time:cancel',
                                                    style: ButtonStyle.Secondary
                                                }),
                                                new ButtonBuilder({
                                                    label: `Confirm`,
                                                    emoji: { id: core.emojis.ids.success },
                                                    customId: 'delay-time:confirm',
                                                    style: ButtonStyle.Secondary
                                                })
                                            ]
                                        })
                                    ]
                                })]
                            })


                        } catch (err) {
                            // Modal Send/Submit Error - Log & Return:
                            collector.stop('modal-fail')
                            createLog.for('Bot').warn('Failed to receive/handle modal submission for /delay cmd!', { err, userId: i?.user?.id, guildId: i?.guildId })
                            return
                        }

                    }
                }

                // Aborting Interaction - Cleanup:
                else if (customId == 'delay-session-cleanup') {
                    try {
                        await i?.deleteReply()
                    } catch (e) { }
                }

            } catch (err) {
                createLog.for('Bot').error(`Delay /cmd interaction (collector) failed!`, { err, userId: i?.user?.id, guildId: i?.guildId });
                collector.stop('errored');
                const errMsg = genericErrorMsg({
                    reasonDesc: `The ${core.commands.string('delay')} command interaction has failed! If this issue persists, please get in contact with [bot support](${URLS.support_chat}).`
                })
                if (i?.replied || i?.deferred) {
                    await i?.followUp({
                        components: [errMsg],
                        flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
                    })
                } else {
                    await i.editReply({
                        components: [errMsg],
                        flags: MessageFlags.IsComponentsV2
                    })
                }
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
                                new TextDisplayBuilder({ content: `## ${core.emojis.string('timeout')}  Interaction Timed Out! - ${core.commands.string('/delay')}` }),
                                new SeparatorBuilder(),
                                new TextDisplayBuilder({ content: `**Details:** \n> Unfortunately, you ran out of time to respond to this interaction... you can try again by using the ${core.commands.string('/delay')} command!` })
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
