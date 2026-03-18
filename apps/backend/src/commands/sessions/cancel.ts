import { ActionRowBuilder, APISelectMenuOption, AutocompleteInteraction, ButtonBuilder, ButtonStyle, ChatInputCommandInteraction, CommandData, CommandInteraction, ComponentType, ContainerBuilder, LabelBuilder, MessageFlags, ModalBuilder, ModalSubmitInteraction, PermissionFlagsBits, SeparatorBuilder, SlashCommandBuilder, SlashCommandStringOption, StringSelectMenuBuilder, TextDisplayBuilder, TextInputModalData, TextInputStyle } from "discord.js";
import { supabase } from "../../utils/database/supabase";
import { DateTime } from "luxon";
import core from "../../utils/core/core";
import { defaultFooterText, genericErrorMsg } from "../../utils/bot/messages/basic";
import { URLS } from "../../utils/core/urls";
import { getSubscriptionFromInteraction } from "@sessionsbot/shared";
import { useLogger } from "../../utils/logs/logtail";
import dbManager from "../../utils/database/manager";

const createLog = useLogger();

export default <CommandData>{
    // Command Definition:
    data: new SlashCommandBuilder()
        .setName('cancel')
        .setDescription('Cancel an active session that has already been posted.')
        .setDefaultMemberPermissions(PermissionFlagsBits.ManageGuild)
    ,
    // Command Cooldown:
    cooldown: 10,
    // Command Execution:
    execute: async (i: ChatInputCommandInteraction) => {
        try {
            // Defer Reply:
            await i.deferReply({ flags: MessageFlags.Ephemeral })

            // Guild Subscription:
            const subscription = getSubscriptionFromInteraction(i)

            // Get Guild Data - Active/Cancelable Posted Sessions:
            const { data: guild, error: guildError } = await supabase
                .from('guilds')
                .select('*')
                .eq('id', i.guildId)
                .single()
            const { data: cancelableSessions, error: sessionsError } = await supabase
                .from('sessions')
                .select(`*, session_rsvp_slots(*, session_rsvps(*))`)
                .eq('guild_id', i.guildId)
                .neq('status', 'canceled')
                .gt('starts_at_utc', DateTime.utc().toISO())
                .order('starts_at_utc', { ascending: false })
                .limit(25)
            if (guildError || sessionsError || !guild) throw { guildError, sessionsError, guildId: i?.guildId }; // Sends default failure msg


            // Send No Available Sessions Message:
            if (!cancelableSessions?.length) {
                return i?.editReply({
                    flags: MessageFlags.IsComponentsV2,
                    components: [new ContainerBuilder({
                        accent_color: core.colors.getOxColor('blue'),
                        components: <any>[
                            new TextDisplayBuilder({ content: `### ${core.emojis.string('info')} No Cancelable Sessions Found...` }),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({ content: `**Details:**\n> It appears you don't have any recently posted \`Sessions\` available to be canceled!` }),
                            new SeparatorBuilder(),
                            new TextDisplayBuilder({ content: `-# **TIP:** Create a new session/event on your [Bot Dashboard](${URLS.site_links.dashboard}). \n-# [Need Help?](${URLS.support_chat})` })
                        ]
                    })]
                })
            }

            // Send Session Selection Message:
            const sessionOptions = cancelableSessions?.map(s => {
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
                        new TextDisplayBuilder({ content: `## ${core.emojis.string('help')}  Cancel Session - Selection:` }),
                        new SeparatorBuilder(),
                        new TextDisplayBuilder({ content: `Select a posted session to cancel: \n> -# Trying to modify a session schedule? Visit your [Bot Dashboard](${URLS.site_links.dashboard}).` }),
                        new ActionRowBuilder({
                            components: [
                                new StringSelectMenuBuilder({
                                    custom_id: 'cancel-session-selected',
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
            let sessionData: typeof cancelableSessions[number] | undefined = undefined;
            let delayInMins: number | undefined = undefined;

            // On Collector Response:
            collector.on('collect', async (ni) => {
                // Parse New Interaction:
                const customId = ni?.customId

                // Session Selected - Start Cancel Modal:
                if (customId == 'cancel-session-selected' && ni.isStringSelectMenu()) {
                    selectedId = ni?.values?.[0]
                    sessionData = cancelableSessions?.find(s => s?.id == selectedId)
                    if (!selectedId || !sessionData) {
                        // Invalid Input - No Session Selected Alert:
                        collector.stop('errored')
                        createLog.for('Bot').warn('Failed to find session data for /cancel cmd interaction!', { userId: i?.user?.id, guildId: i?.guildId, selectedId, sessionData })
                        return await i?.editReply({
                            components: [genericErrorMsg({
                                reasonDesc: `**Invalid Input** - Please select a valid session to cancel!`
                            })]
                        })
                    }
                    // Build Confirmation/Reason Panel:
                    const modal = new ModalBuilder({
                        title: 'Cancel Session - Confirmation',
                        custom_id: 'cancel-session-confirmation',
                        components: [
                            {
                                type: ComponentType.TextDisplay,
                                content: `**Please Confirm**: \n> You're about to **cancel** this session! \n-# However, this will ***NOT** effect the session's scheduling (repeats, if enabled)*. \n-# **Tip:** If you're trying to modify a session's schedule visit your [Bot Dashboard](${URLS.site_links.dashboard})!`
                            },
                            new LabelBuilder({
                                label: 'Reason',
                                component: {
                                    type: ComponentType.TextInput,
                                    custom_id: `cancel-session-reason`,
                                    style: TextInputStyle.Short,
                                    max_length: 100,
                                    required: false,
                                    placeholder: '(optional)',
                                }
                            })
                        ]
                    })
                    // Send Modal
                    await ni.showModal(modal)
                    const modalSubmit = await ni.awaitModalSubmit({
                        time: 60_000
                    }).catch(async (err) => {
                        if (err?.code == "InteractionCollectorError") return
                        collector.stop('modal-errored')
                        createLog.for('Bot').warn('Failed "modal-submission" from /cancel cmd interaction!', { userId: i?.user?.id, guildId: i?.guildId, result })
                        return
                    });
                    // Confirm Submission:
                    if (!modalSubmit) {
                        collector.stop('modal-errored')
                        return await i?.editReply({
                            components: [genericErrorMsg({
                                reasonDesc: `**Modal submission failed!** \n> -# To start this interaction over, use the ${core.commands.string('/cancel')} command.`
                            })]
                        })
                    }
                    // Process Modal Submission:
                    modalSubmit?.deferUpdate().catch(e => { })
                    let cancelReasoning: string | null = (modalSubmit?.fields?.fields?.get('cancel-session-reason') as TextInputModalData)?.value?.trim() ?? null
                    if (cancelReasoning == '') cancelReasoning = null;
                    // Attempt to cancel:
                    const result = await dbManager.sessions.cancel(i.guildId, selectedId, i.user.id, cancelReasoning)
                    if (result.success) {
                        // Canceling Succeeded:
                        const panelUrl = `https://discord.com/channels/${i?.guildId}/${sessionData?.thread_id ?? sessionData?.channel_id}/${sessionData?.panel_id}`;
                        // Send Success Alert:
                        await i?.editReply({
                            components: <any>[new ContainerBuilder({
                                accent_color: core.colors.getOxColor('success'),
                                components: <any>[
                                    new TextDisplayBuilder({ content: `## ${core.emojis.string('success')}  Success - Session Canceled` }),
                                    new SeparatorBuilder(),
                                    new TextDisplayBuilder({ content: `**Session Title:**\n> ${sessionData?.title ?? '?'} \n**Status:**\n> Canceled` }),
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
                            })],
                            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                        })
                    } else {
                        // Canceling Failed:
                        createLog.for('Bot').warn('Failed to cancel a session from /cancel cmd interaction!', { userId: i?.user?.id, guildId: i?.guildId, result })
                        await i?.editReply({
                            components: [genericErrorMsg({
                                reasonDesc: `**Cancellation Failed!** - If this issue persists, feel free to contact bot support.. \n> To try again, use the ${core.commands.string('/cancel')} command.`
                            })],
                            flags: MessageFlags.IsComponentsV2 | MessageFlags.Ephemeral
                        })
                    }
                    collector.stop('completed')
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
                                    new TextDisplayBuilder({ content: `## ${core.emojis.string('timeout')}  Interaction Timed Out! - ${core.commands.string('/cancel')}` }),
                                    new SeparatorBuilder(),
                                    new TextDisplayBuilder({ content: `**Details:** \n> Unfortunately, you ran out of time to respond to this interaction... you can try again by using the ${core.commands.string('/cancel')} command!` })
                                ]
                            })]
                        })
                    }
                } catch (err) {
                    return createLog.for('Bot').warn('Failed to notify of collector ended - /update cmd interaction', { userId: i?.user?.id, guildId: i?.guildId, err, end_reason: r })
                }
            })

        } catch (error) {
            // Base "/cancel" Interaction Error - Log & Alert:
            throw error; // default err handling
        }

    }

}