import { Events, Guild } from "discord.js";
import guildManager from "../utils/database/guildManager.js";
import scheduleManager from "../utils/bot/scheduleManager.js";

/** Event - Guild has removed Sessions Bot */
export default {
    name: Events.GuildCreate,
    async execute(guild:Guild){
        // Handle even in guild manager:
        guildManager.archiveRemovingGuild(guild);
        // Remove any Scheduled Sessions Posts:
        scheduleManager.unScheduleGuildsSessionPosts(guild?.id)
    }
}