import core from "./core/core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import discordLog from "./logs/discord.js";
import { initializeTemplateCreationScheduler } from "./schedules/templateCreations.js";
import sendWithFallback from "./bot/messages/sendWithFallback.js";
import { defaultFooterText, genericErrorMsg } from "./bot/messages/basic.js";
import { ButtonBuilder, ButtonStyle, ComponentType, SeparatorBuilder, ActionRowBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder, MessageFlags } from "discord.js";
import { URLS } from "./core/urls.js";
import { increaseGuildStat } from "./database/manager/statsManager.js";
import { initializeDataDeletionSchedule } from "./schedules/automaticDeletions.js";
import { sendSessionPostFailedFromErrorAlert, sendSessionPostFailedFromPerms } from "./bot/permissions/failedToSendSessionPanel.js";
import dbManager from "./database/manager/dbManager.js";
import { sendPermissionAlert } from "./bot/permissions/permissionsDenied.js";
import { getEventImage } from "./bot/messages/images/eventImages.js";
import { sendUpgradeAlert, upgradeCompleteMessage, upgradeStartingMessage } from "./migration/alerts.js";
import { clearMigrationTests, testMigrator } from "./migration/migrator.js";


const createLog = useLogger();
const guildId = process.env["GUILD_ID_DEVELOPMENT"];
const userId = '252949527143645185'
const channelId = '1430465764619714590'


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

                // await testMigrator()

                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}