import { Database } from "@sessionsbot/shared"
import { supabase } from "../supabase"
import { useLogger } from "../../logs/logtail";

/** The available stat types to increase / alter. */
type StatColumns = Database['public']['Tables']['guild_stats']['Row'];
type StatName = keyof Omit<StatColumns, 'guild_id'>;

/** Used to increase *guild **AND APP** scoped stats/counters* by specified guild id and type. */
export async function increaseGuildStat(guild_id: string, stat_type: StatName, increase_amount?: number) {
    try {
        const { error } = await supabase.rpc('increase_guild_stat', {
            p_guild_id: guild_id,
            p_stat: stat_type,
            p_increase: increase_amount || 1
        })
        if (error) throw error
        else return 'success' as const;
    } catch (err) {
        // Log & Return Err:
        const createLog = useLogger()
        createLog.for('Database').error('Failed to increase guild stat counter! - See Details', { stat_type, guild_id, error: err })
        return { message: 'Failure!', error: err } as const;
    }
}