import { ButtonStyle, ComponentType, ContainerBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, TextChannel, ThreadAutoArchiveDuration, } from "discord.js";
import core from "./core.js";
import discordLog from "./logs/discordLog.js";
import { DateTime } from "luxon";
import { sendPermissionAlert } from "./bot/permissions/permissionsDenied.js";
import { initTemplateCreationScheduler } from "./database/schedules/templates.js";
import { useLogger } from "./logs/logtail.js";

const createLog = useLogger();
const guildId = process.env["GUILD_ID_DEVELOPMENT"]

export default {
    /** Runs on bot startup in DEVELOPMENT environments only. */
    init: async () => {
        try {
            if (process.env['ENVIRONMENT'] == 'development') {
                console.info('--- \n[i] Running Development Tests!');
                // Test here..\

                // const result = await sendPermissionAlert(guildId);
                // console.info(result)

                initTemplateCreationScheduler();

                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}