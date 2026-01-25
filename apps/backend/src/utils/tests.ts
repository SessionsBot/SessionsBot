import { ButtonStyle, ComponentType, ContainerBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, TextChannel, ThreadAutoArchiveDuration, } from "discord.js";
import core from "./core.js";
import { initTemplateCreationScheduler } from "./database/schedules/templatesSchedule.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import fetchSKUs from "./bot/fetchSKUs.js";
import { sendPermissionAlert } from "./bot/permissions/permissionsDenied.js";
import createAuditLog, { AuditEvent } from "./database/auditLog.js";
import { supabase } from "./database/supabase.js";
import guildCreate from "../events/guildCreate.js";


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

                initTemplateCreationScheduler({ runOnExecution: true })

                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}