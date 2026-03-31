import core from "./core/core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import { clearMigrationTests, runMigrator } from "./migration/migrator.js";
import { sendUpgradeAlert } from "./migration/alerts.js";
import { Client, Guild, OAuth2Guild } from "discord.js";
import discordLogs, { sendDiscordLog } from "./logs/discord.js";

const createLog = useLogger();
const guildId = process.env["GUILD_ID_DEVELOPMENT"];
const userId = '252949527143645185'


export default {
    /** Runs on bot startup in DEVELOPMENT environments only. */
    init: async () => {
        try {
            if (ENVIRONMENT_TYPE == 'development') {
                console.info('--- \n[i] Running Development Tests!');
                const { botClient: bot, colors } = core
                // Test here..\

                // console.log(await sendUpgradeAlert('start', guildId))
                // console.log(await sendUpgradeAlert('completed', guildId))

                // await clearMigrationTests()

                // console.log(JSON.stringify(
                //     await runMigrator(), null, 2
                // ))

                // Load Production Bot Guilds:
                // const prodClient = new Client({ intents: 'Guilds' })
                // prodClient.login(process.env?.['DISCORD_BOT_TOKEN'])

                // // Fetch ALL Guild from PROD Client:
                // prodClient.once('clientReady', async (c) => {
                //     let allGuilds: (Guild | OAuth2Guild)[] = [] // new Map<string, Guild | OAuth2Guild>()
                //     let cursor = undefined;
                //     let iteration = 0
                //     while (true) {
                //         iteration++
                //         const fetch = await c.guilds.fetch({ limit: 200, after: cursor })
                //         allGuilds.push(...fetch.values())
                //         if (iteration >= 10) break
                //         if ((fetch?.size ?? 0) > 200) {
                //             cursor = fetch.lastKey()
                //         } else break
                //     }

                //     console.log('Fetched Guilds from PROD Client', allGuilds?.flatMap(g => g?.id))

                // })


                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[❗] Failed to run development tests:', e)
        }
    },
}