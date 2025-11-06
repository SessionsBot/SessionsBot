// -------------------------- [ Imports/Variables ] -------------------------- \\

import {  DateTime  } from "luxon";
import {  db  } from "./firebase.js"; // Import Firebase
import core from "../core.js"; // Import Global Variables
import { // Discord.js:
    ContainerBuilder, 
    SeparatorBuilder, 
    TextDisplayBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    MessageFlags,
    SectionBuilder,
    ThreadAutoArchiveDuration,
    ChannelType,
    Guild
} from 'discord.js';
import logtail from "../logs/logtail.js";
import discordLog from "../logs/discordLog.js";
import databaseManager from "./databaseManager.js";
import guildCreate from "../../events/guildCreate.js";

import { GuildDocData, SubscriptionPlan, SuccessResult, ErrorResult } from '@sessionsbot/shared'
import { isBotPermissionError, sendPermissionAlert } from "../bot/permissionsDenied.js";


// -------------------------- [ Methods/Exports ] -------------------------- \\

ErrorResult

export default {

    /** Add a new guild to database - Triggers from client event inside guildCreate.js */
    addNewGuild: async (guild:Guild) => {try {
        
        /** Default DB configurations for new guilds */
        const defaultConfiguration:GuildDocData = {
            configuration: {
                accentColor: null,
                subscriptionPlan: SubscriptionPlan.Free,
                privateSessions: false,
                sessionSchedules: {},
                signupChannels: {},
                timeZone: 'America/Chicago'
            },
            sessionTimeline: {}
        }

        // Add new guild to Firebase:
        await db.collection('guilds').doc(guild.id).set(
            defaultConfiguration,
        {merge: false})
        // Log new guild added:
        discordLog.events.guildAdded(guild);
        logtail.info(`[➕] - ${guild?.name + ' | ' + guild?.id} has added Sessions Bot!`, {joinDate: guild?.joinedAt, memberCount: guild?.memberCount})
    } catch (err) {
        logtail.error(`[⚠] - Failed to add new guild to database! This is a CRITICAL ERROR!`, {guild: guild, rawError: err});
    }},


    /** Archives a removing guild to database - Triggers from client event inside guildDelete.js */
    archiveRemovingGuild: async (guild: Guild) => {try {
        // Fetch removing guilds data:
        const guildDoc = db.collection('guilds').doc(guild.id);
        const guildDocData = (await guildDoc.get()).data();

        const createdSessions = (Object.entries(guildDocData?.sessionTimeline)?.length >= 1)

        // Save to archived guilds:
        await db.collection('archivedGuilds').doc(guild?.id).set({
            lastConfiguration: guildDocData,
            metaData: {
                name: guild.name,
                createdAt: guild.createdAt,
                joinedAt: guild.joinedAt,
                leftAt: new Date(),
                memberCount: guild.memberCount
            }
        })

        // Remove from regular guilds collection:
        await guildDoc.delete();

        // Log removing guild:
        discordLog.events.guildRemoved(guild, createdSessions);
        logtail.info(`[➖] - ${guild?.name + ' | ' + guild?.id} has removed Sessions Bot!`, {joinDate: guild?.joinedAt, createdSessions})
        
    } catch (err) {
        logtail.error(`[⚠] - Failed to archive removing guild to database! This is a CRITICAL ERROR!`, {guild: guild, rawError: err});
    }},


    /** Update a specified field within a guild doc inside database. */
    updateGuildDocField: async (guildId:string, path:string, value:any) => {try {
        // Update specified path to value:
        db.collection('guilds').doc(guildId).update({
            [`${path}`]: value
        })

        // Return success:
        return new SuccessResult<string>(`The field was updated successfully!`);

    } catch (err) {
        // Log error & return failure:
        logtail.error(`[⚠] - Failed to updated guild value data - ${guildId} - see details`, {guildId, pathToUpdate: path, valueToUpdate: value});
        return new ErrorResult(`The field was updated successfully!`, err);
    }},


    /** Fetches / returns a specified guilds database data by guildId. */
    readGuildDoc: async (guildId:string) => {try {
        // Fetch guild database data:
        const guildData = (await db.collection('guilds').doc(guildId).get()).data() as GuildDocData;
        if(!guildData) throw `No data was found for this guildId!`;
        // Return guild data:
        return new SuccessResult<GuildDocData>(guildData);

    } catch (err) {
        // Log & return failure:
        logtail.error(`[⚠] - Failed to read/get guild from database - ${guildId} - see details`, {guildId, err});
        return new ErrorResult(`Failed to read/get guild from database!`, err);
    }},


    /** Fetches / returns specified guilds database data AND discord data. */
    fetchGuildData: async (guildId: string) => {try {
        // Fetch guild database & discord data:
        const guildDocPromise = db.collection('guilds').doc(guildId).get();
        const guildFetchPromise = core.botClient.guilds.fetch(guildId);
        const [guildDoc, guildFetch] = await Promise.all([guildDocPromise, guildFetchPromise]);
        const guildData = guildDoc.data() as GuildDocData;
        if(!guildData) throw `No data was found for this guildId!`;
        const resultData = {docData: guildData, guildFetch: guildFetch}
        // Return guild data:
        return new SuccessResult<typeof resultData>(resultData);

    } catch (err) {
        // Check for Bot Permission Error:
        if(isBotPermissionError(err)) sendPermissionAlert(guildId)
        // Log & return failure:
        logtail.error(`[⚠] - Failed to HARD read/get guild from database/discord - ${guildId} - see details`, {guildId, err});
        return new ErrorResult(`Failed to hard read/get guild from database/discord!`, err);
    }}

}
