import { Entitlement, Events, Guild } from "discord.js";
import dbManager from "../../utils/database/manager";
import discordLog from "../../utils/logs/discordLog.js";
import { useLogger } from "../../utils/logs/logtail.js";

const createLog = useLogger();

/** Event - Guild has removed Sessions Bot */
export default {
    name: Events.EntitlementDelete,
    async execute(d: Entitlement) {
        console.info(`[-] ENTITLEMENT DELETED!`);
        console.info(d)
    }
}