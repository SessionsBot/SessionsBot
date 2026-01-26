import { Database } from "@sessionsbot/shared";
import { firestore } from "./firebase";
import rsvp from "../../buttons/rsvp";
import { DateTime } from "luxon";


type SESSION_TEMPLATE = Database['public']['Tables']['session_templates']['Row']
interface RSVP_DATA {
    name: string,
    capacity: number,
    emoji: string | null,
    required_roles: string[] | null
}

export async function testMigrator() {
    const guilds = (await firestore.collection('guilds').get()).docs

    const guildsWithTemplates = guilds.filter(g => {
        const data = g.data();
        const templates = data.sessionSchedules
        if (Object.entries(templates)?.length) {
            return true
        } else return false
    })


    for (const guild of guildsWithTemplates) {
        const data = guild.data()
        const schedules = data?.sessionSchedules;
        for (const sch of Object.values(schedules)) {
            const weekdays = sch?.['daysOfWeek']?.length
            const rsvpSlots = (sch?.['roles']?.length)
            const title = sch?.['sessionTitle']
            console.info(`${title} -- RSVP Slots: ${rsvpSlots} -- Weekdays: ${weekdays}`)
        }
    }

    const testGuild = guildsWithTemplates.at(-3)
    const testData = testGuild.data()
    const testTemplates: any[] = testData?.sessionSchedules
    const guildTimeZone = testData?.timeZone
    const t = testTemplates.at(-1)

    // Util: Get roles from old db -> convert to new RSVP Formats:
    const getRsvps = () => {
        const roles: any[] = Object.values(t?.roles)
        if (!roles?.length) return null
        else {
            let r: RSVP_DATA[] = [];
            for (const role of roles) {
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

    // Get Session "Start" Date from old db data -> Jan 1 2026 @Session Time (hh:mm)
    const startUTC = DateTime.now()
        .setZone(guildTimeZone)
        .set({
            day: 1,
            month: 1,
            hour: t?.sessionDateDaily?.hours,
            minute: t?.sessionDateDaily?.minutes,
        })
        .startOf('minute')
        .toUTC()


    const testSession: Partial<SESSION_TEMPLATE> = {
        id: 'UUID-HERE',
        title: t?.sessionTitle,
        description: null,
        url: t?.sessionUrl,
        starts_at_utc: startUTC.toISO(),
        guild_id: testGuild.id,
        channel_id: testData?.sessionSignup?.panelChannelId,
        duration_ms: null,
        expires_at_utc: null,
        last_post_utc: null,
        native_events: false,
        post_in_thread: true,
        mention_roles: testData?.sessionSignup?.mentionRoleIds?.length ? testData?.sessionSignup?.mentionRoleIds : null,
        time_zone: guildTimeZone,
        rsvps: getRsvps() as any,
    }

    console.log({ testSession, rsvps: JSON.stringify(getRsvps(), null, 2) })
}