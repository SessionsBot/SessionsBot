import nodeCron, { ScheduledTask } from "node-cron";
import logtail from "../logs/logtail.js";
import core from "../core.js";
import { db } from "../database/firebase";
import { GuildDocData, GuildSessionSchedules, ValueOf, weekDayString } from "@sessionsbot/shared";
import { DateTime } from "luxon";
import sessionManager from "../database/sessionsManager.js";
const devTesting  = false;

/**#### Holds Currently SCHEDULED Guilds for Daily Sessions Post(s). */
let scheduledGuilds: {[guildId:string]: {[channelId:string]: ScheduledTask}} = {};


/****Initialization function ran on bot startup to load and schedule guild's daily scheduled sessions.***/
let initialized = false;
const onBotStartup = async () => { try {
    // ! CANCEL IN DEV ENVIRONMENT - FOR NOW:
    if(process.env?.['ENVIRONMENT'] == 'development' && !devTesting) return logtail.info('📅💻 - Dev Environment - Skipping Scheduling');

    // Double Run Safe Guard:
    if(initialized) return logtail.warn('📅❓ - Schedule Manager already initialized! - ignoring...');
    else initialized = true;

    // Create Daily 11:45 PM - Refresh Cycle
    const refreshCycle = nodeCron.schedule(`45 23 * * *`, (async (ctx) => {
        // Log & Refresh:
        logtail.info(`⏳ - Loading Daily Guild Session Schedules!`);
        await dailyRefreshCycle();
        // Flush Logs:
        logtail.flush();
    }))

    // Run Refresh to Initialize on Startup:
    await refreshCycle.execute();

} catch (err) {
    // Log Failure:
    logtail.error(`❗📅❗ - FAILED TO INITIALIZE SESSION SCHEDULE MANAGER! - CRITICAL - SEE DETAILS`, {err});
}}


/****Daily refresh cycle used to pull fresh data from database and schedule any sessions for guilds that are configured for THIS day.** */
const dailyRefreshCycle = async () => {try {
    // Compressed Logs:
    let queuedGuilds = [];
    let unqueuedGuilds = [];

    // Fetch all Guilds:
    const botGuilds = await core.botClient.guilds.fetch();
    for(const [guildId, guild] of botGuilds){
        let scheduled = await scheduleGuildsSessionPosts(guildId)
        if(scheduled) queuedGuilds.push(guildId);
        else unqueuedGuilds.push(guildId);
    }

    // Log Daily Refresh - Completed:
    const count = Object.keys(scheduledGuilds).length
    logtail.info(`⌛ - LOADED Guild Schedules! - Scheduled Guilds: ${count}`, {queuedGuilds, unqueuedGuilds})

} catch (err) {
    // Log Failure:
    logtail.error(`❗📅❗ - FAILED TO RUN DAILY REFRESH - SESSION SCHEDULE MANAGER! - CRITICAL - SEE DETAILS`, {err});
}}


/****Creates/Refreshes the "Post Schedules" for a guild'd Signup Channels for the day.***/
const scheduleGuildsSessionPosts = async (guildId:string) => {try {
    // Get Guild Data:
    const [guildDoc, guild] = await Promise.all([ 
        db.collection('guilds').doc(guildId).get(),
        core.botClient.guilds.fetch(guildId)
    ]);
    const guildDbData = guildDoc.data() as GuildDocData;
    const guildSignupChannels = guildDbData.configuration.signupChannels
    const guildSessionSchedules = guildDbData.configuration.sessionSchedules;
    const guildTimezone = guildDbData.configuration.timeZone;
    const guildsWeekdayNumber = DateTime.now().setZone(guildTimezone).plus({days: 1}).toFormat('E') as weekDayString;
    let mappedGuildSchedules:{[chanelId:string]: {[sessionId:string]: ValueOf<GuildSessionSchedules>}} = {};

    // Clear ANY Existing Schedules for Guild:
    for(const [chanId, postSch] of Object.entries(scheduledGuilds[guildId] || {})) {
        postSch?.stop(); postSch?.destroy();
    }

    // Check for Signup Channels - (Setup Complete / or not)
    if(Object.keys(guildSignupChannels).length){
        // Guild Setup:
        let scheduledToday = Object.entries(guildSessionSchedules).filter(([id , sch]) => sch.occurrence.weekdays.includes(guildsWeekdayNumber));

        // Map Schedules to Signup Channels:
        for(const [schId, schData] of scheduledToday){
            const signupChannelId = schData.occurrence.signupChannelId
            const channelExists = (await guild.channels.fetch(signupChannelId)).isSendable()
            if(!channelExists) {
                logtail.warn('!! - A signup channel has been deleted for a scheduled session! It will be skipped for now...', {guildId, schId, signupChannelId});
                continue
            }
            mappedGuildSchedules[signupChannelId] ? mappedGuildSchedules[signupChannelId] = {
                ...mappedGuildSchedules[signupChannelId],
                [schId]: schData
            } : mappedGuildSchedules[signupChannelId] = {[schId]: schData};
        }

        // Schedule EACH Signup Channel Posts w Guild's Preferences:
        let activeGuildSchedules:{[channelId:string]: ScheduledTask} = {} 
        for(const [channelId] of Object.entries(mappedGuildSchedules)){
            const postTimeHr = String(guildDbData.configuration.signupChannels?.[channelId]?.signupPostTime?.hours);
            const postTimeMin = String(guildDbData.configuration.signupChannels?.[channelId]?.signupPostTime?.minuets);

            // Create Post Schedule:
            const newPostSchedule = nodeCron.schedule(`${postTimeMin} ${postTimeHr} * * *`, 
            async (ctx) => {
                // Post Guild Sessions for Signup Channel:
                const post = await sessionManager.sessions.createTodaysScheduledSessions(guildId, channelId);
                if(post.success){
                    logtail.info(`✔ - GUILD SCHEDULE - ${guildId}`, {guildId, post});
                }
                else{
                    logtail.warn(`✖ - GUILD SCHEDULE - ${guildId}`, {post, channelId, guildId});
                }
            }, {
                maxExecutions: 1,
                timezone: guildTimezone,
                maxRandomDelay: 10_000,
            });
            // Save Schedule:
            activeGuildSchedules[channelId] = newPostSchedule;
        };

        // Store Guilds's Post Schedules by GuildId:
        scheduledGuilds[guildId] = activeGuildSchedules;
        return true;

    }else{
        // Guild Un-Setup:
        return false;
    }


} catch (err) {
    // Log Failure:
    logtail.error(`❗📅❗ - FAILED TO SCHEDULE GUILDS SESSIONS - ${guildId} - SEE DETAILS`, {err});
    return false;
}}


/****Removes/Destroys the "Post Schedules" for a guild'd Signup Channels for the day.***/
const unScheduleGuildsSessionPosts = async (guildId:string) => {try {
    // Clear ANY Existing Schedules for Guild:
    for(const [chanId, postSch] of Object.entries(scheduledGuilds[guildId] || {})) {
        postSch?.stop(); postSch?.destroy();
    }
    return true;
} catch (err) {
    // Log Failure:
    logtail.warn(`❗📅❗ - FAILED TO UN-SCHEDULE GUILDS SESSIONS - ${guildId} - SEE DETAILS`, {err});
    return false;
}}


// Exports:
export default{
    onBotStartup,
    scheduleGuildsSessionPosts,
    unScheduleGuildsSessionPosts,
    scheduledGuilds
}