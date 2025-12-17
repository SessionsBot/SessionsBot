import { Events, Guild } from "discord.js";
import dbManager from "../utils/database/manager";
import discordLog from "../utils/logs/discordLog.js";
import { Log } from "../utils/logs/logtail.js";

/** Event - Guild has removed Sessions Bot */
export default {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        // Log removing guild:
        new Log('Guilds').info(`+ GUILD ADDED - ${guild.name} - ${guild.id}`);
        discordLog.events.guildRemoved(guild, true);

        // Delete removing guild from database:
        const result = await dbManager.guilds.delete(guild.id);
        if (!result.success) {
            return new Log('Database').error('Failed to delete! - Removing Guild - SEE DETAILS', { result })
        }


        // - Remove any Scheduled Sessions Posts:
        // scheduleManager.unScheduleGuildsSessionPosts(guild?.id)
    }
}