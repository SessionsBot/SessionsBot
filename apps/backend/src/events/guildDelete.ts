import { Events, Guild } from "discord.js";
import dbManager from "../utils/database/manager";
import discordLog from "../utils/logs/discord.js";
import { useLogger } from "../utils/logs/logtail.js";

const createLog = useLogger();

/** Event - Guild has removed Sessions Bot */
export default {
    name: Events.GuildCreate,
    async execute(guild: Guild) {
        // Log removing guild - cloud:
        createLog.for('Guilds').info(`➖ GUILD REMOVED - ${guild.name} - ${guild.id}`);

        // Delete Guild from database:
        const result = await dbManager.guilds.delete(guild.id);
        if (!result.success) {
            return createLog.for('Database').error('Failed to delete! - Removing Guild - SEE DETAILS', { result })
        } else {
            // Log removing guild - Discord:
            discordLog.events.guildRemoved(guild, (result.data.templateCount ?? null))
        }
    }
}