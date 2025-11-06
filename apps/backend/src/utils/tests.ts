import { ButtonStyle, ComponentType, ContainerBuilder, ActionRowBuilder, ButtonBuilder, MessageFlags, SectionBuilder, SeparatorBuilder, TextDisplayBuilder, TextChannel, ThreadAutoArchiveDuration, } from "discord.js";
import core from "./core.js";
import guildManager from "./database/guildManager.js";
import discordLog from "./logs/discordLog.js";
import { DateTime } from "luxon";
import sessionsManager from "./database/sessionsManager.js";
import { GuildSignupChannels, weekDayString, ErrorResult, ValueOf } from "@sessionsbot/shared";
import { sendPermissionAlert } from "./bot/permissionsDenied.js";
import { db } from "./database/firebase.js";
import scheduleManager from "./bot/scheduleManager.js";
import { object } from "zod";


const guildId = process.env["GUILD_ID_DEVELOPMENT"]
const channelId = '1413653266931122186';

const testSignupChannelId = '1430465764619714590';


export default {
    /** Runs on bot startup in DEVELOPMENT environments only. */
    init: async () => { try {
        if(process.env['ENVIRONMENT'] == 'development'){
            console.info('--- \n[i] Running Development Tests!');
            // Test here..\

            // const fetchGuild = await guildManager.fetchGuildData(guildId)
            // if(!fetchGuild.success) throw 'Failed to fetch guild for test..';
            // const {docData, guildFetch:guild} = fetchGuild.data;

            // End testing..
            console.info('[i] Development Tests Completed! \n---');  
        }
    }catch(e) { 
        console.warn('[!] Failed to run development tests:', e)
    }},
}