import core from "./core/core.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import discordLog from "./logs/discord.js";
import { initTemplateCreationScheduler } from "./database/schedules/templatesSchedule.js";
import sendWithFallback from "./bot/messages/sendWithFallback.js";
import { defaultFooterText } from "./bot/messages/basic.js";
import { ButtonBuilder, ButtonStyle, ComponentType, SeparatorBuilder, ActionRowBuilder, ContainerBuilder, SectionBuilder, TextDisplayBuilder } from "discord.js";
import { URLS } from "./core/urls.js";
import { increaseGuildStat } from "./database/manager/statsManager.js";


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

                // const r = await increaseGuildStat(guildId, "sessions_created", 7)
                // console.info('Increase Result', r)

                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}