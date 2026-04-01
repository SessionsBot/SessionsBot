import core from "./core/core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import { clearMigrationTests, runMigrator } from "./migration/migrator.js";
import { sendUpgradeAlert } from "./migration/alerts.js";
import { Client, Guild, OAuth2Guild } from "discord.js";
import discordLogs, { sendDiscordLog } from "./logs/discord.js";
import { MigratingTemplates_DeletionDate } from "@sessionsbot/shared";

const createLog = useLogger();
const guildId = process.env["GUILD_ID_DEVELOPMENT"];
const userId = '252949527143645185'


// util - migration alerts:
const sendMigrationAlerts = async () => {
    // Fetch ALL Guild from PROD Client:
    let allGuilds: (Guild | OAuth2Guild)[] = [] // new Map<string, Guild | OAuth2Guild>()
    let cursor = undefined;
    let iteration = 0
    while (true) {
        iteration++
        const fetch = await core.botClient.guilds.fetch({ limit: 200, after: cursor })
        allGuilds.push(...fetch.values())
        if (iteration >= 10) break
        if ((fetch?.size ?? 0) > 200) {
            cursor = fetch.lastKey()
        } else break
    }

    console.log('Fetched Guilds from PROD Client', allGuilds?.flatMap(g => g?.id))

    // Alert each fetched guild:
    const alertedGuildIds = [];
    const failedAlertGuilds = [];
    for (const g of allGuilds) {
        const sendResult = await sendUpgradeAlert('completed', g?.id)
        if (!sendResult?.success) {
            failedAlertGuilds.push(g?.id)
            console.warn('----------------------\nFAILED TO SEND UPGRADING ALERT FOR GUILD:', g?.id, sendResult, '\n----------------------')
        } else {
            console.info(`[✅] Send update alert to guild ${g?.id}`)
            alertedGuildIds.push(g?.id)
        }
    }


    console.info('ALERTED GUILDS:', JSON.stringify(alertedGuildIds))
    console.info('FAILED TO ALERT GUILDS:', JSON.stringify(failedAlertGuilds))
}


export default {
    /** Runs on bot startup in DEVELOPMENT environments only. */
    init: async () => {
        try {
            if (ENVIRONMENT_TYPE == 'development') {
                console.info('--- \n[i] Running Development Tests!');
                // Test here...


                await sendMigrationAlerts()


                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[❗] Failed to run development tests:', e)
        }
    },
}