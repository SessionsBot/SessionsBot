import { FullSessionData } from "@sessionsbot/shared";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, SectionBuilder, SeparatorBuilder, TextChannel, TextDisplayBuilder } from "discord.js";
import { DateTime } from "luxon";
import core from "../../core/core";
import { safeParse, url } from "zod";
import { defaultFooterText } from "./basic";
import { useLogger } from "../../logs/logtail";
import { processVariableText } from "./variableText";
import { isBotPermissionError, sendPermissionAlert } from "../permissions/permissionsDenied";

const createLog = useLogger();


export async function buildSessionPanelMsg(session: FullSessionData, showWatermark: boolean, accent_color: string, addToCalendarButton: boolean) {
    try {
        // Get Template/Session Data:
        const s = session;
        const startsAt = DateTime.fromISO(s.starts_at_utc);
        const endsAt = s.duration_ms ? startsAt.plus({ millisecond: s.duration_ms }) : null;
        const pastStart = DateTime.now() >= startsAt;
        const rsvpSlots = s.session_rsvp_slots
        const isCanceled = s.status == 'canceled'


        // Util: Canceled / Delayed Alert Texts:
        const getStatusAlerts = () => {
            let r = ''
            if (s.status == 'delayed')
                r += `\n> ${core.emojis.string('timeout')}  **DELAYED!**`
            if (s.status == 'canceled')
                r += `\n> ${core.emojis.string('no_entry')}  **CANCELED!**`
            return r
        }

        // Util: Get Star Date Section:
        const getStartDateSection = () => {
            const datesText = new TextDisplayBuilder({ content: `**${core.emojis.string('clock')} Starts at:** \n> <t:${startsAt.toSeconds()}:d> | <t:${startsAt.toSeconds()}:t> ${endsAt ? `\n**${core.emojis.string('clock')} Ends at:** \n> <t:${endsAt.toSeconds()}:d> | <t:${endsAt.toSeconds()}:t>` : ''} ` })
            if (addToCalendarButton) {
                // Start Date Section w/ Calendar Buttons:
                return [
                    new SectionBuilder({
                        components: <any>[datesText],
                        accessory: {
                            type: ComponentType.Button,
                            style: ButtonStyle.Secondary,
                            custom_id: `ADD_TO_CAL:${s.id}`,
                            emoji: { name: 'calendar', id: core.emojis.ids.calendar }
                        }
                    })
                ]
            } else
                // Return Just Start & End Dates
                return [datesText]
        }


        // Util: Map RSVPs to Section Components:
        const getRSVPsSections = () => {
            let r = [];
            if (rsvpSlots?.length) {
                for (const rsvp of rsvpSlots) {
                    // RSVP Slot Vars:
                    const rsvpTitle = rsvp.emoji ? `${rsvp.emoji} ${rsvp.title}` : rsvp.title
                    const slotAssignees = rsvp.session_rsvps
                    const atCapacity = (slotAssignees?.length ?? 0) >= rsvp.capacity;
                    const capacityString = `\`${slotAssignees?.length ?? 0}/${rsvp.capacity}\``
                    const mappedAssignees = () => {
                        if (!slotAssignees?.length) {
                            return `> No RSVPs`
                        } else {
                            return `> <@${slotAssignees.map(a => a.user_id).join(`\n> > <@`) + '>'}`
                        }
                    }
                    const emojiLabel = () => {
                        if (atCapacity || isCanceled) return { name: 'no_entry', id: core.emojis.ids.no_entry };
                        if (pastStart) return { name: 'timeout', id: core.emojis.ids.timeout };
                        else return { name: 'user_success', id: core.emojis.ids.user_success };
                    }
                    // Add RSVP Section to Msg:
                    r.push(
                        new SectionBuilder({
                            components: <any>[
                                new TextDisplayBuilder({ content: `**${rsvpTitle}** *${capacityString}* \n${mappedAssignees()}` })
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                custom_id: 'rsvp:' + rsvp.id + `:${s.id}`,
                                emoji: emojiLabel(),
                                style: ButtonStyle.Secondary,
                                disabled: (pastStart || atCapacity || isCanceled) ? true : false
                            }
                        }),
                        new SeparatorBuilder()
                    )
                }
                return r;
            } else return [];
        }


        // Util: Create Action Row / Footer Component:
        const getActionButtons = () => {
            let r: ButtonBuilder[] = [];
            // IF - Session Location Button:
            if (s.url && safeParse(url(), s.url)?.success) {
                r.push(new ButtonBuilder({
                    style: ButtonStyle.Link,
                    url: s.url,
                    emoji: { name: 'link', id: core.emojis.ids.link },
                    label: 'Location',
                }))
            }
            // View Online Button
            r.push(new ButtonBuilder({
                emoji: { name: 'eye', id: core.emojis.ids.eye },
                label: 'View Online',
                style: ButtonStyle.Link,
                url: `https://sessionsbot.fyi/sessions/${s.id}`
            }))
            // Return Full Action Row:
            return [
                new ActionRowBuilder<ButtonBuilder>({
                    components: r,
                    type: ComponentType.ActionRow
                })
            ]
        }

        // Util: Get Roles Mentions - Footer:
        const getFooter = () => {
            let r = [];
            if (showWatermark) {
                r.push(
                    defaultFooterText()
                )
            }
            if (s?.mention_roles?.length) {
                r.push(
                    new TextDisplayBuilder({ content: `-# ${core.emojis.string('bell')}: <@&${s.mention_roles.join(`> <@&`)}> ` })
                )
            }
            return r
        }


        // Build Root Msg Container:
        const msg = new ContainerBuilder({
            accent_color: Number(accent_color.replace('#', '0x')) || core.colors.getOxColor('purple'),
            components: <any>[
                new TextDisplayBuilder({ content: `## ${s.title} ${getStatusAlerts()} ${s?.description ? `\n${processVariableText(s.description)}` : ''}` }),
                new SeparatorBuilder(),
                ...getStartDateSection(),
                new SeparatorBuilder(),
                ...getRSVPsSections(),
                ...getActionButtons(),
                new SeparatorBuilder(),
                ...getFooter()
            ]
        })

        // Return Built Msg Container:
        return msg;
    } catch (err) {
        // Msg Build - Error Occurred:
        createLog.for('Bot').error('FAILED to create Session Signup - See Details', { err, sessionId: session.id, guildId: session.guild_id })
        return null
    }
}


export async function updateExistingSessionPanel(session: FullSessionData, watermark: boolean, accent_color: string, calendar_button: boolean) {
    try {
        const destChannel = session?.thread_id ? session.thread_id : session?.channel_id;
        // Get Panel Contents & Fetch Destination Msg:
        const [panelContent, panelChannel] = await Promise.all([
            buildSessionPanelMsg(session, watermark, accent_color, calendar_button),
            core.botClient.channels.fetch(destChannel) as Promise<TextChannel>
        ])

        const panel = await panelChannel?.messages?.fetch(session.panel_id)
        await panel.edit({
            components: [panelContent]
        })
        return { success: true, message: 'Session Panel Updated!' }

    } catch (error) {
        // Check for permission errors:
        if (isBotPermissionError(error)) {
            await sendPermissionAlert(session?.guild_id)
            // Log & Return Error:
            createLog.for('Bot').info('Perms - Failed to build/send a session panel update - See details...', { error })
            return { success: false, message: 'Failed to update a session panel for an update!' }
        }
        // Log & Return Error:
        createLog.for('Bot').error('Failed to build/send a session panel update - See details...', { error })
        return { success: false, message: 'Failed to update a session panel for an update!' }
    }
}


export function buildSessionThreadStartMsg(title: string, description: string, accent_color: string, watermark: boolean,) {
    let r = new ContainerBuilder({
        accent_color: Number(accent_color?.replace('#', '0x')) || core.colors.getOxColor('purple'),
        components: <any>[
            new TextDisplayBuilder({ content: `### ${title}` }),
            new SeparatorBuilder(),
            new TextDisplayBuilder({ content: description })
        ]
    })
    if (watermark) r.components.push(
        defaultFooterText()
    )
    return r
}