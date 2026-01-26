import core from "./core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";

import { testMigrator } from "./migration/migrator.js";


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

                // const start = DateTime.now().plus({ hours: 2 }).startOf('hour')
                // const end = start.plus({ hours: 2 }).startOf('hour')

                // const guild = await bot.guilds.fetch(guildId);
                // const event = await guild.scheduledEvents.create({
                //     privacyLevel: GuildScheduledEventPrivacyLevel.GuildOnly,
                //     entityType: GuildScheduledEventEntityType.External,
                //     entityMetadata: { location: null },
                //     image: guild.bannerURL({ size: 512 }),
                //     name: 'Test Event',
                //     description: 'This is *an* example **description**.',
                //     scheduledStartTime: start.toJSDate(),
                //     scheduledEndTime: end.toJSDate()
                // })

                // console.info('Event Created!', event.name, event.url)

                // initTemplateCreationScheduler({ runOnExecution: true })

                testMigrator()


                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}