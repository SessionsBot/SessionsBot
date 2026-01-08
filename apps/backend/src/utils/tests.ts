import { ButtonStyle, ComponentType, ContainerBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, TextChannel, ThreadAutoArchiveDuration, } from "discord.js";
import core from "./core.js";
import discordLog from "./logs/discordLog.js";
import { DateTime } from "luxon";
import { sendPermissionAlert } from "./bot/permissions/permissionsDenied.js";
import { initTemplateCreationScheduler } from "./database/schedules/templatesSchedule.js";
import { useLogger } from "./logs/logtail.js";
import { sendFailedToPostSessionAlert } from "./bot/permissions/failedToSendMsg.js";
import { supabase } from "./database/supabase.js";
import { buildSessionSignupMsg } from "./bot/messages/sessionSignup.js";

const createLog = useLogger();
const guildId = process.env["GUILD_ID_DEVELOPMENT"];
const channelId = '1430465764619714590'

export default {
    /** Runs on bot startup in DEVELOPMENT environments only. */
    init: async () => {
        try {
            if (process.env['ENVIRONMENT'] == 'development') {
                console.info('--- \n[i] Running Development Tests!');
                const { botClient: bot, colors } = core
                // Test here..\

                // const result = await sendPermissionAlert(guildId);
                // console.info(result)

                initTemplateCreationScheduler();

                // Send Test Session Signup Panels:
                const testSignup = async () => {
                    const templateId = '8e35e585-7c5f-47f4-848d-e32e8b91236a';
                    const { data: template, error: templateERR } = await supabase.from('session_templates').select('*').eq('id', templateId).single()
                    if (!template || templateERR) return console.info('Failed Test:', { template, templateERR });

                    const msgContent = buildSessionSignupMsg(template, 'UNKNOWN')
                    const channel = await (await bot.guilds.fetch(guildId)).channels.fetch(channelId);
                    if (channel.isSendable()) {
                        channel.send({
                            components: [msgContent],
                            flags: MessageFlags.IsComponentsV2
                        })
                    } else return await sendFailedToPostSessionAlert(guildId, channelId, [template.id]);
                }
                // await testSignup()

                // sendFailedToPostSessionAlert(guildId, channelId, [
                //     'c7eb4sd7-a068-491f-9bd8-c5437ba8fad7',
                //     '309e4e72-e32c-4d40-86db-ec253c054cc0',
                //     'ca6c2810-3614-47a0-b785-9aaf097d8432'
                // ])

                // End testing..
                console.info('[i] Development Tests Completed! \n---');
            }
        } catch (e) {
            console.warn('[!] Failed to run development tests:', e)
        }
    },
}