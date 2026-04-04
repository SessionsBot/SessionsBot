import { EventData, Events, Guild } from "discord.js";
import dbManager from "../utils/database/manager";
import { sendDiscordLog } from "../utils/logs/discord.js";
import { useLogger } from "../utils/logs/logtail.js";

const createLog = useLogger();

/** Event - Guild has removed Sessions Bot */
export default <EventData>{
    name: Events.GuildDelete,
    async execute(g: Guild) {
        // Log removing guild - cloud:
        createLog.for('Guilds').info(`❌ GUILD REMOVED - ${g?.name} - ${g?.id}`, {
            guildId: g?.id,
            memberCount: g?.memberCount,
            largeServer: g?.large,
            addedAt: g?.joinedAt,
            ownerId: g?.ownerId
        });

        // Delete Guild from database:
        const result = await dbManager.guilds.delete(g?.id);
        if (!result.success) {
            return createLog.for('Database').error('Failed to delete! - Removing Guild - SEE DETAILS', { guildId: g?.id, result })
        } else {
            // Log removing guild - Discord:
            sendDiscordLog.events.guildRemoved(g, (result.data.templateCount ?? null))
        }
    }
}