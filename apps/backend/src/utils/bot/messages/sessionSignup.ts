import { Database } from "@sessionsbot/shared";
import { ActionRowBuilder, ButtonBuilder, ButtonStyle, ComponentType, ContainerBuilder, SectionBuilder, SeparatorBuilder, TextDisplayBuilder } from "discord.js";
import { DateTime } from "luxon";
import core from "../../core/core";
import { safeParse, url } from "zod";
import { defaultFooterText } from "./basic";
import { supabase } from "../../database/supabase";
import { useLogger } from "../../logs/logtail";

const createLog = useLogger();
const { botClient: bot, colors } = core

export async function buildSessionSignupMsg(session: Database['public']['Tables']['sessions']['Row'], showWatermark: boolean) {
    try {
        // Get Template/Session Data:
        const s = session;
        const startsAt = DateTime.fromISO(s.starts_at_utc);
        const endsAt = s.duration_ms ? startsAt.plus({ millisecond: s.duration_ms }) : null;
        const pastStart = DateTime.now() >= startsAt;

        // Fetch Session RSVP Slots:
        const { data: rsvpSlots, error: rsvpSlotsErr } = await supabase.from('session_rsvp_slots')
            .select('*')
            .eq('session_id', s.id)
            .select()
        if (rsvpSlotsErr) {
            createLog.for('Database').error('FAILED TO GET RSVP SLOTS - For Signup Msg - See Details', { rsvpSlotsErr, session: s })
        }

        // Fetch Session RSVP Assignees:
        let sessionAssignees: Database['public']['Tables']['session_rsvps']['Row'][] = [];
        if (rsvpSlots?.length) {
            const { data: curRsvpAssignees, error: rsvpAssigneesErr } = await supabase.from('session_rsvps')
                .select('*')
                .eq('session_id', s.id)
                .select()
            if (rsvpAssigneesErr) {
                createLog.for('Database').error('FAILED TO GET RSVP ASSIGNEES - For Signup Msg - See Details', { rsvpAssigneesErr, session: s })
            }
            sessionAssignees = curRsvpAssignees;
        }


        // Util: Map RSVPs to Section Components:
        const getRSVPsSections = () => {
            let r = [];
            if (rsvpSlots?.length) {
                for (const rsvp of rsvpSlots) {
                    // RSVP Slot Vars:
                    const rsvpTitle = rsvp.emoji ? `${rsvp.emoji} ${rsvp.title}` : rsvp.title
                    const slotAssignees = sessionAssignees.filter(a => a.rsvp_slot_id == rsvp.id)
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
                        if (atCapacity) return '⛔';
                        if (pastStart) return '⌛';
                        else return '☑️';
                    }
                    // Add RSVP Section to Msg:
                    r.push(
                        new SectionBuilder({
                            components: <any>[
                                new TextDisplayBuilder({ content: `**${rsvpTitle}** *${capacityString}* \n${mappedAssignees()}` })
                            ],
                            accessory: {
                                type: ComponentType.Button,
                                custom_id: rsvp.id.replace('_', ':') + `:${s.id}`,
                                label: emojiLabel(),
                                style: ButtonStyle.Secondary,
                                disabled: (pastStart || atCapacity) ? true : false
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
                    new TextDisplayBuilder({ content: `-# 🔔: <@&${s.mention_roles.join(`> <@&`)}> ` })
                )
            }
            return r
        }


        // Build Root Msg Container:
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


export function buildSessionThreadStartMsg(date: DateTime, watermark: boolean, accent_color?: number) {
    let r = new ContainerBuilder({
        accent_color: accent_color || colors.getOxColor('purple'),
        components: <any>[
            new TextDisplayBuilder({ content: `### 📅 Sessions for ${date.month}/${date.day}` }),
            new SeparatorBuilder(),
            new TextDisplayBuilder({ content: `-# You can view todays scheduled events/sessions by opening the attached thread below. 😊` })
        ]
    })
    if (watermark) r.components.push(
        defaultFooterText()
    )
    return r
}