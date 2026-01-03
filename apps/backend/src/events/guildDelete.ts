import { Events, Guild } from "discord.js";
import dbManager from "../utils/database/manager";
import discordLog from "../utils/logs/discordLog.js";
import { useLogger } from "../utils/logs/logtail.js";

const createLog = useLogger();

/** Event - Guild has removed Sessions Bot */
export default {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        // Log removing guild:
        createLog.for('Guilds').info(`+ GUILD ADDED - ${guild.name} - ${guild.id}`);
        discordLog.events.guildRemoved(guild, true);

        // Delete removing guild from database:
        const result = await dbManager.guilds.delete(guild.id);
        if (!result.success) {
            return createLog.for('Database').error('Failed to delete! - Removing Guild - SEE DETAILS', { result })
        }


        // - Remove any Scheduled Sessions Posts:
        // scheduleManager.unScheduleGuildsSessionPosts(guild?.id)
    }
}