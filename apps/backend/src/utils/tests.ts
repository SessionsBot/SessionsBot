import { ButtonStyle, ComponentType, ContainerBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, TextChannel, ThreadAutoArchiveDuration, GuildScheduledEventPrivacyLevel, GuildScheduledEventEntityType, } from "discord.js";
import core, { get0xColor } from "./core.js";
import { initTemplateCreationScheduler } from "./database/schedules/templatesSchedule.js";
import { useLogger } from "./logs/logtail.js";
import { ENVIRONMENT_TYPE } from "./environment.js";
import fetchSKUs from "./bot/fetchSKUs.js";
import { sendPermissionAlert } from "./bot/permissions/permissionsDenied.js";
import createAuditLog, { AuditEvent } from "./database/auditLog.js";
import { supabase } from "./database/supabase.js";
import guildCreate from "../events/guildCreate.js";
import { SubscriptionSKUs } from "@sessionsbot/shared";
import { defaultFooterText } from "./bot/messages/basic.js";
import sendWithFallback from "./bot/messages/sendWithFallback.js";
import { DateTime } from "luxon";


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

                initTemplateCreationScheduler({ runOnExecution: true })


                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}