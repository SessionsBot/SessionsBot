import { GuildSessionData, ValueOf, GuildSessionSchedules, weekDayString, ErrorResult, SuccessResult } from "@sessionsbot/shared";
import { db } from "./firebase.js";
import core from "../core.js";
import guildManager from "./guildManager.js";
import logtail from "../logs/logtail.js";
import { FieldValue } from "firebase-admin/firestore";
import databaseManager from "./databaseManager.js";
import { DateTime } from "luxon";
import { RsvpResult } from "../types/rsvpResponses.js";
import getSessionDayPath from "./utils/getSessionDayPath.js";
import { ChannelType, MessageFlags, TextChannel, ThreadAutoArchiveDuration, ThreadChannel } from "discord.js";
import { isBotPermissionError, sendPermissionAlert } from "../bot/permissionsDenied.js";
import { createSessionSignupContainer } from "../bot/messageBuilders/sessionsMsgs.js";

const sessionManager = {

    /** Utility functions for a guild's saved session data */
    sessions: {

        /** Create a new session for a guild with specified data. */
        create: async (guildId:string, guildTimeZone:string, sessionData:GuildSessionData) => {try {

            // Create a new session id:
            const sessionId = ('ses_' + crypto.randomUUID().replace(/-/g, '').slice(0, 7));

            // Get todays session timeline path:
            const sessionDayPath = getSessionDayPath(guildTimeZone);
            
            // Add new session to guild database data:
            await db.collection('guilds').doc(guildId).update({
                [`sessionTimeline.${sessionDayPath}.${sessionId}`]: sessionData
            });

            // Increase global counter:
            databaseManager.globalCounters.incrementSessionsCreated(1);

            // Return success:
            return new SuccessResult({sessionId})

        } catch (err) {
            // Log & return failure:
            logtail.warn(`[⚠] Failed to create session for guild in database!`, {guildId, sessionData, err})
            return new ErrorResult(`Failed to create schedule for guild!`, err)
        }},

        /** Modifies an existing session for a guild with specified id & data. */
        modify: async (guildId:string, timelinePath:string, sessionId:string, sessionData:GuildSessionData) => {try {

            // Modify session in guild database data:
            await db.collection('guilds').doc(guildId).update({
                [`sessionTimeline.${timelinePath}.${sessionId}`]: sessionData
            });

            // Return success:
            return new SuccessResult(`The session was modified successfully. Id - ${sessionId}`)

        } catch (err) {
            // Log & return failure:
            logtail.warn(`[⚠] Failed to modify session for guild in database!`, {guildId, sessionId, sessionData, err})
            return new ErrorResult(`Failed to modify schedule for guild!`, err)
        }},

        rsvps: {
            /** Attempts to RSVP a user to a specified guild's session. */
            add: async (guildId:string, sessionId:string, sessionDayPath:string, rsvpId:string, userId:string) => {try {
                // Read guild data:
                const getGuild = await guildManager.readGuildDoc(guildId)
                const guildData = getGuild.success ? getGuild.data : null;
                if(!guildData) throw ['Failed to fetch guild data to RSVP user!', getGuild]

                // Session Data:
                const sessionData = guildData.sessionTimeline?.[sessionDayPath]?.[sessionId];
                const rsvpRoleData = sessionData?.rsvps?.[rsvpId];
                if(!sessionData || !rsvpRoleData) return new RsvpResult("Not Found / Outdated", null);
                
                // Check if session has already occurred:
                const sessionOccurrenceDate = DateTime.fromSeconds(Number(sessionData.startsAt.discordTimestamp));
                const sessionAlreadyOccurred = sessionOccurrenceDate.diffNow().valueOf() <= 0;
                if(sessionAlreadyOccurred) return new RsvpResult("Already Occurred", {staleSessionData: sessionData});

                // Check already RSVPed to session:
                const alreadyAssignedWithinSession = Object.values(sessionData?.rsvps || {}).some(rsvp => rsvp.users.includes(String(userId)))
                if(alreadyAssignedWithinSession) return new RsvpResult('Already Assigned', {staleSessionData: sessionData});

                // Check if RSVP role is at capacity:
                const rsvpRoleAtCapacity = rsvpRoleData.users.length >= rsvpRoleData.capacity;
                if(rsvpRoleAtCapacity) return new RsvpResult('At Capacity', {staleSessionData: sessionData});

                // Add user to RSVP in database:
                await db.collection('guilds').doc(guildId).update({
                    [`sessionTimeline.${sessionDayPath}.${sessionId}.rsvps.${rsvpId}.users`]: FieldValue.arrayUnion(userId)
                })

                // Update Signup Panel:
                await sessionManager.sessions.refreshSignupPanel(guildId, sessionId);

                // Return Success:
                return new RsvpResult("Success", {staleSessionData: sessionData});

            } catch (err) {
                // Log & return failure:
                logtail.warn(`[⚠] Failed to RSVP a user to session! See details..`, {guildId, sessionId, rsvpId, userId, err})
                return new RsvpResult('Internal Failure', null)
            }},

            /** Attempts to remove a user as an RSVP from a specified guild's session. */
            remove: async (guildId:string, sessionId:string, sessionDayPath:string, userId:string) => {try {
                // Read guild data:
                const getGuild = await guildManager.readGuildDoc(guildId)
                const guildData = getGuild.success ? getGuild.data : null;
                if(!guildData) throw ['Failed to fetch guild data to RSVP user!', getGuild]

                // Session Data:
                const sessionData = guildData.sessionTimeline?.[sessionDayPath]?.[sessionId]
                if(!sessionData) return new RsvpResult("Not Found / Outdated", null);

                // Check if session has already occurred:
                const sessionOccurrenceDate = DateTime.fromSeconds(Number(sessionData.startsAt.discordTimestamp));
                const sessionAlreadyOccurred = sessionOccurrenceDate.diffNow().valueOf() <= 0;
                if(sessionAlreadyOccurred) return new RsvpResult("Already Occurred", {staleSessionData: sessionData});

                // Check / Find RSVP role where user is assigned:
                let userAssigned = null;
                for(const [rsvpId, rsvpData] of Object.entries(sessionData?.rsvps || {})){
                    if(rsvpData?.users?.includes(userId)){
                        userAssigned = rsvpId
                        break
                    }
                }

                if(!userAssigned) return new RsvpResult("Not Assigned", {staleSessionData: sessionData});
                
                // Remove User from RSVP Role:
                await db.collection('guilds').doc(guildId).update({
                    [`sessionTimeline.${sessionDayPath}.${sessionId}.rsvps.${userAssigned}.users`]: FieldValue.arrayRemove(userId) 
                });

                // Update Signup Panel:
                sessionManager.sessions.refreshSignupPanel(guildId, sessionId);

                // Return Success:
                return new RsvpResult("Success", {staleSessionData: sessionData});

            } catch (err) {
                // Log & return failure:
                logtail.warn(`[⚠] Failed to un-RSVP a user to session! See details..`, {guildId, sessionId, userId, err})
                return new RsvpResult('Internal Failure', null)
            }}
        },


        /** Create and POSTS todays sessions scheduled for a guild's signup channel */
        createTodaysScheduledSessions: async (guildId:string, signupChannelId:string) => { try {
            
            // Read Guild Data:
            const getGuild = await guildManager.fetchGuildData(guildId)
            const guildData = getGuild.success ? getGuild.data.docData : null
            const guild = getGuild.success ? getGuild.data.guildFetch : null
            if(!guildData || !guild) throw ['Failed to fetch guild/data!', getGuild]
            const guildSchedules = Object.entries(guildData?.configuration?.sessionSchedules || {})
            const guildTimeZone = guildData?.configuration?.timeZone;

            // Get day of week in guilds timezone:
            const todaysWeekdayNum = DateTime.now().setZone(guildTimeZone).toFormat('E')
            const sessionsDayPath = getSessionDayPath(guildData.configuration.timeZone);

            // Get schedules assigned to specified signup channel:
            const channelSchedules  = guildSchedules.filter(([id, data]) => data.occurrence.signupChannelId == signupChannelId)

            // Create sessions from guild schedules:
            let queuedSessions: {[sesId:string]: GuildSessionData} = {};
            let totalCreated = 0;
            for(const [schId, schData] of channelSchedules) {
                // Check if scheduled today:
                const scheduledToday = schData.occurrence.weekdays.includes(todaysWeekdayNum as weekDayString)
                const schHour = schData.occurrence.startTime.hours;
                const schMinute = schData.occurrence.startTime.minuets;
                if(!scheduledToday) continue;

                // Create Session Data:
                let sessionData:GuildSessionData = {
                    title: schData.title,
                    description: schData.description,
                    url: schData?.url || null,
                    createdAt: new Date(),
                    createdBy: 'SCHEDULE',
                    state: 'scheduled',
                    signup:{
                        channelId: schData.occurrence.signupChannelId,
                        messageId: null, 
                        threadId: null, 
                    },
                    startsAt: {
                        hours: schHour,
                        minuets: schMinute,
                        discordTimestamp: String(Math.floor(DateTime.now().setZone(guildTimeZone).set({hour: schHour, minute: schMinute, second: 0, millisecond: 0}).toSeconds()))
                    },
                    rsvps: schData.rsvps,
                }

                // Queue session:
                const sessionId = ('ses_' + crypto.randomUUID().replace(/-/g, '').slice(0, 10));
                queuedSessions[sessionId] = sessionData;

                // Increase Counters:
                totalCreated += 1;
                
            }

            // Fetch Channel:
            const signupChannel = await guild.channels.fetch(signupChannelId) as TextChannel

            // Check / get target signup channel sessions thread for today:
            const todaysThreadDateString = DateTime.now().setZone(guildTimeZone).toFormat('L/d'); // eg: 12/31
            const existingTodaysSessionsThread = (await signupChannel.threads.fetchActive())?.threads?.find(thread => thread?.name?.includes(todaysThreadDateString))
            const targetThread = existingTodaysSessionsThread ? existingTodaysSessionsThread : await signupChannel.threads.create({
                name: `📅 Sessions - ${todaysThreadDateString}`,
                type: ChannelType.PublicThread,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneDay,
            });

            // Post & Save Queued Sessions:
            let finalizedResult = {};
            for(const [sesId, sesData] of Object.entries(queuedSessions)) {
                
                // Post Sessions in Todays Sessions Thread:
                const buildSignupMsg = createSessionSignupContainer(guildId, guildData, sesId, sesData);
                const signupMsg = buildSignupMsg.success ? buildSignupMsg.data : null;
                if(!signupMsg) throw ['failed to build session signup msg:', buildSignupMsg];

                const sessionSignupMsg = await targetThread.send({
                    components: <any>[signupMsg],
                    flags: MessageFlags.IsComponentsV2
                });

                // Add to finalized db save result with new signup msg ids:
                finalizedResult[sesId] = <GuildSessionData>{
                    ...sesData,
                    signup: {
                        threadId: targetThread.id,
                        channelId: signupChannel.id,
                        messageId: sessionSignupMsg.id
                    }
                };

            }

            // Save newly posted sessions to database:
            const existingSessions = guildData.sessionTimeline[sessionsDayPath]
            await db.collection('guilds').doc(guildId).update({
                [`sessionTimeline.${sessionsDayPath}`]: {
                    ...existingSessions,
                    ...finalizedResult
                }
            }); 

            // Increase counters:
            databaseManager.globalCounters.incrementSessionsCreated(totalCreated);
            
            // Return Success:
            return new SuccessResult(`Created Daily Scheduled Sessions for Guild ${guildId}`);

        } catch (err) { 
            // Check for Bot Permission Error:
            if(isBotPermissionError(err)) sendPermissionAlert(guildId)
            // Log & return failure:
            logtail.warn(`[⚠] Failed to create daily scheduled sessions for guild!`, {guildId, err})
            return new ErrorResult(`Failed to create scheduled sessions for guild!`, err);
        }},


        /** Updates a specified sessions signup panel by provided inputs */
        refreshSignupPanel: async (guildId:string, sessionId:string) => { try {
            
            // Read Guild/Session Data:
            const fetchGuild = await guildManager.fetchGuildData(guildId);
            const guildData = fetchGuild.success ? fetchGuild.data.docData : null;
            const guild = fetchGuild.success ? fetchGuild.data.guildFetch : null;
            if(!guild || !guildData) throw ['Failed to fetch guild for session signup panel refresh!', fetchGuild];

            const sessionDayPath = getSessionDayPath(guildData.configuration.timeZone);
            const sessionData = guildData.sessionTimeline?.[sessionDayPath]?.[sessionId];

            // Update signup panel:
            const getUpdate = createSessionSignupContainer(guildId, guildData, sessionId, sessionData)
            const newSignupMsg = getUpdate.success ? getUpdate.data : null;
            if(!newSignupMsg) throw ['Failed to build updated signup panel msg for session', getUpdate];

            const signupThread = await guild.channels.fetch(sessionData.signup.threadId) as ThreadChannel;
            const update = await signupThread.messages.edit(sessionData.signup.messageId, {
                components: [newSignupMsg],
                flags: MessageFlags.IsComponentsV2
            });

            // Return Success:
            return new SuccessResult<void>(null);

        } catch (err) {
            // Check for Bot Permission Error:
            if(isBotPermissionError(err)) sendPermissionAlert(guildId)
            // Log & return failure:
            logtail.warn(`[⚠] Failed to update Session Signup Panel! See details..`, {guildId, sessionId, err})
            return new ErrorResult('Failed to update Session Signup Panel!', err)
        }},


    },



    /** Utility functions for a guild's saved schedule data */
    schedules: {

        /** Creates a new sessions schedule within provided guild. */
        create: async (guildId:string, scheduleData:ValueOf<GuildSessionSchedules>) => {try {
            // Create a new sch ID - (ex: sch_d40a4abe095c):
            const schId = ('sch_' + crypto.randomUUID().replace(/-/g, '').slice(0, 12));

            // Add new schedule to guild doc:
            const result = await guildManager.updateGuildDocField(guildId, `configuration.sessionSchedules.${schId}`, scheduleData);
            
            // Return success:
            return new SuccessResult('Schedule has been created successfully!');

        } catch (err) {
            // Log & return failure:
            logtail.warn(`[⚠] Failed to create schedule for guild in database!`, {guildId, scheduleData, err})
            return new ErrorResult(`Failed to create schedule for guild!`, err);
        }},


        /** Edit/update an existing guild session schedule by id. */
        modify: async (guildId:string, scheduleId:string, scheduleData:ValueOf<GuildSessionSchedules>) => {try {
            // Add new schedule to guild doc:
            const result = await guildManager.updateGuildDocField(guildId, `configuration.sessionSchedules.${scheduleId}`, scheduleData);

            // Return success:
            return new SuccessResult('Schedule has been created successfully!');

        } catch (err) {
            // Log & return failure:
            logtail.warn(`[⚠] Failed to create schedule for guild in database!`, {guildId, scheduleData, err})
            return new ErrorResult(`Failed to create schedule for guild!`, err)
        }},


        /** Delete an existing guild session schedule by id. */
        delete: async (guildId:string, scheduleId:string) => { try {
            // Find and delete schedule by id:
            db.collection('guilds').doc(guildId).update({
                [`configuration.sessionSchedules.${scheduleId}`]: FieldValue.delete()
            })

            // Return Success:
            return new SuccessResult('Schedule has been deleted successfully!');

        } catch (err) {
            // Log & return failure:
            logtail.warn(`[⚠] Failed to delete schedule for guild in database!`, {guildId, scheduleId, err})
            return new ErrorResult(`Failed to delete schedule for guild!`, err);
        }},

    }
}

export default sessionManager