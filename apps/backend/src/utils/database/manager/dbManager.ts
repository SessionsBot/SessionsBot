import { Guild } from "discord.js";
import { supabase } from "../supabase";
import { Database } from "@sessionsbot/shared";

// Response class & types:
class dbResult {
    /** Returns a successful response */
    static success<d>(data: d) {
        return {
            success: true as true,
            data,
            error: null
        }
    }
    /** Returns a failed response */
    static failure<e>(error: e) {
        return {
            success: false as false,
            data: null,
            error
        }
    }
};


/** **Util:** Database Manager for various supabase database actions. */
export default {

    guilds: {
        /** Adds a NEW guild to the `Guilds` database table. */
        async add(guild: Guild) {
            const { data: saveData, error } = await supabase.from('guilds').upsert({
                id: guild.id,
                name: guild?.name,
                owner_id: guild?.ownerId,
                member_count: guild?.memberCount,
                joined_at: guild.joinedAt?.toISOString() ?? null,
            }, { onConflict: 'id' }).select().single();

            if (!saveData || error) {
                // Failed save - Return:
                return dbResult.failure({ message: `Failed to add guild!`, saveData, error });
            } else {
                // Succeeded - Return data:
                return dbResult.success({ saveData })
            }
        },


        /** Updates an EXISTING guild from the `Guilds` database table. */
        async update(guildId: string, data: Database['public']['Tables']['guilds']['Update']) {
            const { data: saveData, error } = await supabase.from('guilds').update(data).eq('id', guildId).select().single();
            if (!saveData || error) {
                // Failed save - Return:
                return dbResult.failure({ message: `Failed to make changes to guild!`, inputData: data, saveData, error });
            } else {
                // Succeeded - Return data:
                return dbResult.success({ saveData });
            }
        },


        /** Deletes an EXISTING guild from the `Guilds` database table. */
        async delete(guildId: string) {
            const { error } = await supabase.from('guilds').delete().eq('id', guildId);
            if (error) {
                // Failed save - Return:
                return dbResult.failure({ message: `Failed to delete guild!`, error });
            } else {
                // Succeeded - Return data:
                return dbResult.success({ message: `Successfully deleted guild!`, guildId })
            }
        },
    }

}


// export default dbManager;