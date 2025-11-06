import { Events, Guild } from "discord.js";
import guildManager from "../utils/database/guildManager.js";

/** Event - New guild added Sessions Bot */
export default {
    name: Events.GuildCreate,
    async execute(guild:Guild){
        // Handle even in guild manager:
        guildManager.addNewGuild(guild);
        // Send Welcome Message:
        
    }
}

console.debug('I need a welcome msg!')