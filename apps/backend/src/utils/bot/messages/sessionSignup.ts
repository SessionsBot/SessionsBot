import { Database, mapRsvps } from "@sessionsbot/shared";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { DateTime } from "luxon";
import core from "../../core";
import { safeParse, url } from "zod";
import { defaultFooterText } from "./basic";

const { botClient: bot, colors } = core

export function buildSessionSignupMsg(t: Database['public']['Tables']['session_templates']['Row'], sessionId: string) {
    // Get Template Data:
    const rsvps = t?.rsvps ? mapRsvps(t.rsvps) : null;
    const startsAt = DateTime.fromISO(t.next_post_utc).plus({ millisecond: t.post_before_ms });
    const endsAt = t.duration_ms ? startsAt.plus({ millisecond: t.duration_ms }) : null;

    // Util: Map RSVPs to Section Components:
    const getRSVPsSections = () => {
        let r = [];
        if (rsvps) {
            for (const [id, data] of rsvps) {
                const rsvpTitle = data.emoji ? `${data.emoji} ${data.name}` : data.name
                const capacityState = `\`0/${data.capacity}\``
                const mappedRSVPs = [];
                r.push(new SectionBuilder({
                    components: <any>[
                        new TextDisplayBuilder({ content: `**${rsvpTitle}** *${capacityState}* \n> No RSVPs` })
                    ],
                    accessory: {
                        type: ComponentType.Button,
                        custom_id: id.replace('_', ':'),
                        label: '☑️',
                        style: ButtonStyle.Secondary
                    }
                }), new SeparatorBuilder())
            }
            return r;
        } else return [];
    }

    // Util: Create Action Row / Footer Component:
    const getActionButtons = () => {
        let r: ButtonBuilder[] = [];
        // IF - Session Location Button:
        if (t.url && safeParse(url(), t.url)?.success) {
            r.push(new ButtonBuilder({
                style: ButtonStyle.Link,
                url: t.url,
                label: '📍 Location',
            }))
        }
        // View Online Button
        r.push(new ButtonBuilder({
            label: '👁️ View Online',
            style: ButtonStyle.Link,
            url: `https://sessionsbot.fyi/sessions/${sessionId}`
        }))
        // Return Full Action Row:
        return [
            new ActionRowBuilder<ButtonBuilder>({
                components: r,
                type: ComponentType.ActionRow
            })
        ]
    }

    // Build Root Msg Container:
    const msg = new ContainerBuilder({
        accent_color: colors.getOxColor('purple'),
        components: <any>[
            new TextDisplayBuilder({ content: `## ${t.title} ${t?.description ? `\n-# ${t.description}` : ''}` }),
            new SeparatorBuilder(),
            new SectionBuilder({
                components: <any>[
                    new TextDisplayBuilder({ content: `**⏰ Starts at:** \n> <t:${startsAt.toSeconds()}:d> | <t:${startsAt.toSeconds()}:t> ${endsAt ? `\n**⏰ Ends at:** \n> <t:${endsAt.toSeconds()}:d> | <t:${endsAt.toSeconds()}:t>` : ''} ` }),
                ],
                accessory: {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    custom_id: `ADD_TO_CAL:${sessionId}`,
                    label: '📅'
                }
            }),
            new SeparatorBuilder(),
            ...getRSVPsSections(),
            ...getActionButtons(),
            new SeparatorBuilder(),
            defaultFooterText(),
            new TextDisplayBuilder({ content: `-# ID: ${sessionId/**.split('-').at(-1) */}` }),
        ]
    })

    // Return Built Msg Container:
    return msg;
}