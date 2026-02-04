import core from "./core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import discordLog from "./logs/discord.js";
import { initTemplateCreationScheduler } from "./database/schedules/templatesSchedule.js";


const createLog = useLogger();
const guildId = process.env["GUILD_ID_DEVELOPMENT"];
const channelId = '1430465764619714590'


export default {
    /** Runs on bot startup in DEVELOPMENT environments only. */
    init: async () => {
        try {
            if (ENVIRONMENT_TYPE == 'development') {
                console.info('--- \n[i] Running Development Tests!');
                const { botClient: bot, colors } = core
                // Test here..\


                // testMigrator()

                // fetch guild:
                const guild = await bot.guilds.fetch(guildId)
                await discordLog.events.guildRemoved(guild)

                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}