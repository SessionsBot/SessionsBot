import { Entitlement, Events, Guild } from "discord.js";
import dbManager from "../../utils/database/manager";
import discordLog from "../../utils/logs/discordLog.js";
import { useLogger } from "../../utils/logs/logtail.js";
import core from "../../utils/core";

const createLog = useLogger();
const entitlement_SKUs = core

/** Event - Guild has removed Sessions Bot */
export default {
    name: Events.EntitlementCreate,
    async execute(d: Entitlement) {
        console.info(`[+] ENTITLEMENT CREATED!`);
        console.info(d)

        // Add Entitlement to DB:

    }
}