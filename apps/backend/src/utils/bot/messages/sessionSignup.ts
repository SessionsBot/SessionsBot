import { Database } from "@sessionsbot/shared";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { DateTime } from "luxon";
import core from "../../core";
import { safeParse, url } from "zod";
import { defaultFooterText } from "./basic";
import { supabase } from "../../database/supabase";
import { useLogger } from "../../logs/logtail";

const createLog = useLogger();
const { botClient: bot, colors } = core

export async function buildSessionSignupMsg(opts: {
    session: Database['public']['Tables']['sessions']['Row'],
}) {
    // Get Template/Session Data:
    const { session: s } = opts;
    const startsAt = DateTime.fromISO(s.starts_at_utc)
    const endsAt = s.duration_ms ? startsAt.plus({ millisecond: s.duration_ms }) : null;

    // Fetch Session RSVP Slots:
    const { data: rsvpSlots, error: rsvpSlotsErr } = await supabase.from('session_rsvp_slots')
        .select('*')
        .eq('session_id', s.id)
        .select()
    if (rsvpSlotsErr) {
        createLog.for('Database').error('FAILED TO GET RSVP SLOTS - For Signup Msg - See Details', { rsvpSlotsErr, session: s })
    }

    // Fetch Session RSVP Assignees:
    let rsvpAssignees: Database['public']['Tables']['session_rsvps']['Row'][] = [];
    if (rsvpSlots?.length) {
        const { data: curRsvpAssignees, error: rsvpAssigneesErr } = await supabase.from('session_rsvps')
            .select('*')
            .eq('session_id', s.id)
            .select()
        if (rsvpAssigneesErr) {
            createLog.for('Database').error('FAILED TO GET RSVP ASSIGNEES - For Signup Msg - See Details', { rsvpAssigneesErr, session: s })
        }
        rsvpAssignees = curRsvpAssignees;
    }


    // Util: Map RSVPs to Section Components:
    const getRSVPsSections = () => {
        let r = [];
        if (rsvpSlots?.length) {
            for (const rsvp of rsvpSlots) {
                const rsvpTitle = rsvp.emoji ? `${rsvp.emoji} ${rsvp.title}` : rsvp.title
                const capacityState = `\`0/${rsvp.capacity}\``
                r.push(new SectionBuilder({
                    components: <any>[
                        new TextDisplayBuilder({ content: `**${rsvpTitle}** *${capacityState}* \n> No RSVPs` })
                    ],
                    accessory: {
                        type: ComponentType.Button,
                        custom_id: rsvp.id.replace('_', ':'),
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
        if (s.url && safeParse(url(), s.url)?.success) {
            r.push(new ButtonBuilder({
                style: ButtonStyle.Link,
                url: s.url,
                label: '📍 Location',
            }))
        }
        // View Online Button
        r.push(new ButtonBuilder({
            label: '👁️ View Online',
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

    // Build Root Msg Container:
    const splitId = s.id.split('-')
    const msg = new ContainerBuilder({
        accent_color: colors.getOxColor('purple'),
        components: <any>[
            new TextDisplayBuilder({ content: `## ${s.title} ${s?.description ? `\n-# ${s.description}` : ''}` }),
            new SeparatorBuilder(),
            new SectionBuilder({
                components: <any>[
                    new TextDisplayBuilder({ content: `**⏰ Starts at:** \n> <t:${startsAt.toSeconds()}:d> | <t:${startsAt.toSeconds()}:t> ${endsAt ? `\n**⏰ Ends at:** \n> <t:${endsAt.toSeconds()}:d> | <t:${endsAt.toSeconds()}:t>` : ''} ` }),
                ],
                accessory: {
                    type: ComponentType.Button,
                    style: ButtonStyle.Secondary,
                    custom_id: `ADD_TO_CAL:${s.id}`,
                    label: '📅'
                }
            }),
            new SeparatorBuilder(),
            ...getRSVPsSections(),
            ...getActionButtons(),
            new SeparatorBuilder(),
            defaultFooterText(),
            new TextDisplayBuilder({ content: `-# ID: ${splitId.at(-1) + splitId.at(-2)}` }),
        ]
    })

    // Return Built Msg Container:
    return msg;
}