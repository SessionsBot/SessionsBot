import core from "./core/core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import { supabase } from "./database/supabase.js";
import { getSchedulesNextPostUTC } from "@sessionsbot/shared";
import { DateTime } from "luxon";

const createLog = useLogger();
const guildId = process.env["GUILD_ID_DEVELOPMENT"];
const userId = '252949527143645185'


export default {
    /** Runs on bot startup in DEVELOPMENT environments only. */
    init: async () => {
        try {
            if (ENVIRONMENT_TYPE == 'development') {
                console.info('--- \n[i] Running Development Tests!');
                // Test here...

                const { data, error } = await supabase.from('session_templates').select('*')
                    .eq('id', 'b3af7141-f032-4171-b2ba-c7227fa45df2')
                    .single()
                if (error || !data) throw error ?? 'No data from db!'

                // Test Calc
                const r = getSchedulesNextPostUTC({
                    firstStartUtc: DateTime.fromISO(data.starts_at_utc, { zone: 'utc' }),
                    postOffsetMs: data.post_before_ms,
                    RRule: data?.rrule,
                    timeZone: data?.time_zone,
                    afterDate: DateTime.utc()
                })

                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[❗] Failed to run development tests:', e)
        }
    },
}