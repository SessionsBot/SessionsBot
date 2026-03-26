import core from "./core/core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import { clearMigrationTests, runMigrator } from "./migration/migrator.js";

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

                // const result = await runMigrator()

                // console.info('Migrator Results: \n', result)

                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}