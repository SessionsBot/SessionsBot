import { API_GuildPreferencesDefaults, Database } from "@sessionsbot/shared";
import { firestore } from "./firebase";
import { DateTime } from "luxon";
import rrulePkg from "rrule";
import { supabase } from "../database/supabase";
import core from "../core/core";
import { APIGuild, Client, REST, Routes } from "discord.js";
import { useLogger } from "../logs/logtail";

const { RRule, datetime } = rrulePkg

const createLog = useLogger();

const debugAll = true

const save_guild_ids = ['593097033368338435']
const delete_guild_ids = ['1420496963782053910', '593097033368338435']


type SESSION_TEMPLATE = Database['public']['Tables']['session_templates']['Row']
interface RSVP_DATA {
    name: string,
    capacity: number,
    emoji: string | null,
    required_roles: string[] | null
}

export async function runMigrator() {
    // ALL GUILD FROM FB:
    const guilds = (await firestore.collection('guilds').get()).docs

    // DEBUG:
    const guildsWithTemplates = guilds.filter(g => {
        const data = g.data();
        const templates: any[] = data.sessionSchedules
        if (templates?.length) {
            return true
        } else return false
    })
    const guildsWithTemplatesAndRoles = guildsWithTemplates.filter((t) => {
        const data = t?.data()
        return data.sessionSchedules?.some((t) => t?.roles?.length > 1) ?? false
    })
    console.info(`(i) - Total Guilds in Firebase:`, guilds?.length)
    console.info(`(i) - Total Guilds WITH TEMPLATES:`, guildsWithTemplates?.length)
    console.info(`(i) - Total Guilds WITH TEMPLATES & ROLES:`, guildsWithTemplatesAndRoles?.length)

    const failedGuildIds = new Set<string>()
    const succeededGuildIds = new Set<string>()

    // For Each FB Guild:
    for (const guildDoc of guilds) {

        // Guild Vars:
        const guildData = guildDoc?.data()
        if (!guildData) {
            console.warn('No data for guild doc?:', guildDoc?.id);
            failedGuildIds.add(guildDoc?.id)
            continue
        }

        // Guild Time Zone:
        const guildTimeZone: string = guildData?.timeZone
        // Guild Accent Color:
        const guildAccentColor: string = guildData?.accentColor
            ? String(guildData?.accentColor)?.replace('0x', '#')
            : API_GuildPreferencesDefaults.accent_color

        // Guild Session Schedules:
        const guildSchedules: {
            sessionTitle: string,
            sessionDateDaily: { hours: number, minutes: number },
            scheduleId: string,
            daysOfWeek: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[]
            sessionUrl?: string | null,
            roles?: {
                roleName: string,
                roleCapacity: number,
                roleEmoji: string | null,
                roleDescription: never,
                users: never[]
            }[] | null

        }[] = guildData?.sessionSchedules

        // Guilds Session Signup Config:
        const guildSignupConfig: {
            dailySignupPostTime: {
                hours: number,
                minutes: number,
            },
            mentionRoleIds: string[],
            panelChannelId: string,
            signupThreadId: string
        } = guildData?.sessionSignup


        // Guild Row Save:
        const guildJoinedDate = DateTime.fromSeconds(guildDoc?.createTime.seconds, { zone: 'utc' })
        const newGuildSave: Database['public']['Tables']['guilds']['Insert'] = {
            id: guildDoc?.id,
            name: 'UNKNOWN ATM',
            owner_id: 'UNKNOWN ATM',
            accent_color: guildAccentColor ?? API_GuildPreferencesDefaults.accent_color,
            joined_at: guildJoinedDate?.toISO(),
        }

        if (debugAll) console.info(`PROCESSING GUILD -- ${guildDoc?.id} -- DB SAVE: \n`, newGuildSave)

        let migratingTemplates: Database['public']['Tables']['migrating_templates']['Insert'][] = []
        // Process Templates/Schedules:
        if (guildSchedules?.length) {
            for (const sch of guildSchedules) {
                // Get Sch "Start" Date from Firebase -> Jan 1 2026 @Session Time (hh:mm) - (guild time zone)
                const startInZone = DateTime.now()
                    .setZone(guildTimeZone)
                    .set({
                        day: 1,
                        month: 1,
                        hour: sch?.sessionDateDaily?.hours,
                        minute: sch?.sessionDateDaily?.minutes,
                    })
                    .startOf('minute')

                // Compute the "Post Before Ms" offset from session post time:
                const computePostBeforeMs = () => {
                    let postInZone = startInZone.set({ hour: guildSignupConfig?.dailySignupPostTime?.hours, minute: guildSignupConfig?.dailySignupPostTime?.minutes })
                    if (postInZone > startInZone) {
                        // Post TOO LATE - Subtract 1 Day:
                        if (debugAll) console.info(`This post date was TOO LATE! - Subtracting 1 DAY!`, `ORG: ${postInZone?.toFormat('F')} ZONE: ${guildTimeZone}`)
                        postInZone = postInZone.minus({ day: 1 })
                    }
                    return Math.max(startInZone.toMillis() - postInZone.toMillis(), 0)
                }

                // Get RSVP Data from Firebase:
                const getRsvps = () => {
                    if (!sch?.roles?.length) return null
                    else {
                        let r: RSVP_DATA[] = [];
                        for (const role of sch?.roles) {
                            r.push({
                                name: role?.roleName,
                                emoji: role?.roleEmoji || null,
                                capacity: role?.roleCapacity,
                                required_roles: null
                            })
                        }
                        return r
                    }
                }

                // Get RRule "days of week" from Firebase:
                const daysOfWkFromFb = () => {
                    let wds: rrulePkg.ByWeekday[] = [];
                    if (!sch?.daysOfWeek) return [RRule.SU, RRule.MO, RRule.TU, RRule.WE, RRule.TH, RRule.FR, RRule.SA]
                    if (sch.daysOfWeek?.includes('sunday')) wds.push(RRule.SU);
                    if (sch.daysOfWeek?.includes('monday')) wds.push(RRule.MO);
                    if (sch.daysOfWeek?.includes('tuesday')) wds.push(RRule.TU);
                    if (sch.daysOfWeek?.includes('wednesday')) wds.push(RRule.WE);
                    if (sch.daysOfWeek?.includes('thursday')) wds.push(RRule.TH);
                    if (sch.daysOfWeek?.includes('friday')) wds.push(RRule.FR);
                    if (sch.daysOfWeek?.includes('saturday')) wds.push(RRule.SA);
                    return wds
                }

                // Build RRule Recurrence String for Sch from Firebase Data:
                const schRRule = new RRule({
                    freq: RRule.WEEKLY,
                    interval: 1,
                    byweekday: daysOfWkFromFb(),
                    dtstart: datetime(startInZone.year, startInZone.month, startInZone.day, startInZone.hour, startInZone.minute, 0),
                    tzid: guildTimeZone
                })

                const newTemplateSave: Database['public']['Tables']['migrating_templates']['Insert'] = {
                    title: sch?.sessionTitle,
                    description: null,
                    url: sch?.sessionUrl || null,
                    guild_id: guildDoc?.id,
                    starts_at_utc: startInZone?.toUTC()?.toISO(),
                    time_zone: guildTimeZone,
                    channel_id: guildSignupConfig.panelChannelId,
                    mention_roles: guildSignupConfig?.mentionRoleIds?.length
                        ? guildSignupConfig.mentionRoleIds
                        : null,
                    native_events: false,
                    post_in_thread: true,
                    rsvps: getRsvps() as any,
                    rrule: schRRule?.toString() || null,
                    post_before_ms: computePostBeforeMs()
                }

                migratingTemplates.push(newTemplateSave)

                if (debugAll) console.info(`--- Guild Sch - ${guildDoc?.id} --- ${sch?.sessionTitle}`, 'DB Save: \n', newTemplateSave,)

            }
        }
        if (debugAll) console.info(`------- END GUILD -------`)



        // Actually Save - Test Guilds:
        // Skip non test guilds:
        if (!save_guild_ids?.includes(guildDoc?.id)) {
            failedGuildIds.add(guildDoc?.id)
            continue
        }


        // Use Prod Bot Client
        const rest = new REST({ version: "10" }).setToken(process.env.DISCORD_BOT_TOKEN);
        // Fetch Guild:
        const guild: APIGuild = await rest.get(
            Routes.guild(guildDoc?.id)
        ) as any;


        // Save Guild Row:
        const { error: guildERR } = await supabase.from('guilds').upsert({
            ...newGuildSave,
            name: guild?.name,
            owner_id: guild?.owner_id
        })
        if (guildERR) {
            createLog.for('Database').error(`[MIGRATIONS]: Failed to save GUILD ROW`, { guildId: guildDoc?.id, err: guildERR })
            failedGuildIds.add(guildDoc?.id)
            continue
        }

        // Save Guild Stats Row
        const { error: guildStatsERR } = await supabase.from('guild_stats').upsert({
            guild_id: newGuildSave?.id
        })
        if (guildStatsERR) {
            createLog.for('Database').error(`[MIGRATIONS]: Failed to save GUILD STATS ROW`, { guildId: guildDoc?.id, err: guildStatsERR })
            failedGuildIds.add(guildDoc?.id)
            continue
        }

        // Save Test Guild Migrating Template Rows:
        const { data: templatesData, error: templatesERR } = await supabase.from('migrating_templates')
            .insert([
                ...migratingTemplates
            ])
            .select()
        if (templatesERR) {
            createLog.for('Database').error(`[MIGRATIONS]: Failed to save TEMPLATE ROW(S)!`, { guildId: guildDoc?.id, err: templatesERR })
            failedGuildIds.add(guildDoc?.id)
            continue
        }

        // Succeeded Guild:
        succeededGuildIds.add(guildDoc?.id)

    }

    // Return Results
    return {
        succeeded: [...succeededGuildIds?.values()],
        failed: [...failedGuildIds?.values()]
    } as const

}


export async function clearMigrationTests() {
    // const { error: tErr, count: tCnt } = await supabase.from('migrating_templates').delete({ count: "exact" })
    //     .in('guild_id', delete_guild_ids)
    // console.info(`Cleaned up "migrating_templates":`, { count: tCnt, error: tErr })
    // Delete guild rows:
    const { error: gErr, count: gCnt } = await supabase.from('guilds').delete({ count: "exact" })
        .in('id', delete_guild_ids)
    console.info(`Cleaned up "guilds":`, { count: gCnt, error: gErr })
}