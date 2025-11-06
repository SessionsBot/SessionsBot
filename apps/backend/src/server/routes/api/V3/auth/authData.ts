import { admin, db } from "../../../../../utils/database/firebase.js"
import logtail from "../../../../../utils/logs/logtail.js";
import { AuthedUser, UserGuildData, UserGuilds } from "@sessionsbot/shared";
import core from "../../../../../utils/core.js";
import { PermissionFlagsBits, PermissionsBitField } from "discord.js";
import axios from "axios";
import jwt from 'jsonwebtoken'
import lzString from 'lz-string'

const JWT_SECRET = process.env?.['JWT_SECRET'];


/****📝 Saves a new authentication for provided user.***/
const saveAuthentication = async (userId:string, username:string, email:string, refreshToken:string) => {try {
    // Attempt to save new auth data:
    await db.collection('users').doc(userId).set({
        refreshToken,
        email,
        username,
        lastSignIn: new Date()
    });
} catch (err) {
    // Log if errored:
    logtail.warn(`[👤] FAILED to save auth data / refresh token - see details..`, {err, userId, username});
}}



/****🔓 Fetches provided users Discord oAuth refresh token to update/refresh data.***/
export const getRefreshToken = async (userId:string) => {try {
    const userData = (await db.collection('users').doc(userId).get())?.data() || null
    const {refreshToken} = userData;
    if(!userData || !refreshToken) throw `Failed to get refresh auth token for user! (${userId})`;
    return refreshToken;
} catch (err) {
    // Log & Return:
    logtail.warn(`[👤] Failed to fetch refresh token for user! - See details...`, {err, userId});
    return null;
}}



/****🔐 Gets fresh user data from provided access token from Discord oAuth or refresh.***/
export const newAuthPayload = async (accessToken:string, refreshToken:string) => {try {
    // Get User Data from Discord API:
    const userDataRequest = await axios.get("https://discord.com/api/users/@me", {headers: { Authorization: `Bearer ${accessToken}` }});
    const userData = userDataRequest.data;
    const userId = userData?.id;
    const username = userData?.username;
    const userEmail = userData?.email;

    // Get Users Guilds from Discord API:
    const usersGuildsRequest = await axios.get("https://discord.com/api/users/@me/guilds", {headers: { Authorization: `Bearer ${accessToken}` }});
    const usersGuildsData = usersGuildsRequest.data;

    // Map Guilds from Discord Data:
    const allGuilds:UserGuilds['all'] = {};
    const manageableGuilds:UserGuilds['manageable'] = {};
    const botGuilds = await core.botClient.guilds.fetch();
    for (const guild of usersGuildsData || []) {
        // Get Guild Icon URL:
        const iconHash = guild?.icon;
        const iconExt = iconHash && iconHash?.startsWith("a_") ? "gif" : "png";
        const guildIconURL = iconHash ? `https://cdn.discordapp.com/icons/${guild?.id}/${iconHash}.${iconExt}?size=512` : 'https://cdn.discordapp.com/embed/avatars/0.png';
        
        // Map guild data:
        const guildData:UserGuildData = {
            name: guild?.name,
            subscriptionPlan: guild?.name,
            isGuildOwner: guild?.owner,
            hasSessionsBot: botGuilds.has(guild?.id),
            iconUrl: guildIconURL,
        }
        
        // Add to all guilds map:
        allGuilds[guild?.id] = guildData;
        
        // Check for admin or manage server
        const userPerms = new PermissionsBitField(BigInt(guild.permissions));
        if ( userPerms.has(PermissionFlagsBits.Administrator) || userPerms.has(PermissionFlagsBits.ManageGuild)) {
            // Add to managed guilds map:
            manageableGuilds[guild?.id] = guildData;
        }
    }

    // Get User's Icon/Avatar Url:
    const iconHash = userData?.avatar;
    const iconExt = iconHash && iconHash?.startsWith("a_") ? "gif" : "png";
    const userIcon = iconHash ? `https://cdn.discordapp.com/icons/${userId}/${iconHash}.${iconExt}?size=512` : 'https://cdn.discordapp.com/embed/avatars/0.png';

    // Create Authed User Data/Payload:
    const authPayload:AuthedUser = {
        id: userId,
        username: username,
        displayName: userData?.global_name,
        accentColor: userData?.accent_color,
        iconUrl: userIcon,
        email: userEmail,
        guilds: {all: allGuilds, manageable: manageableGuilds}
    }

    // Create Firebase Token:
    const firebaseToken = await admin.auth().createCustomToken(userId, {
        email: userData?.email,
        provider: 'discord'
    });

    // Save Refresh Code in Database:
    saveAuthentication(userId, username, userEmail, refreshToken);

    // Compress and Send User to Web App w/ Tokens:
    const internalToken = jwt.sign(authPayload, JWT_SECRET, {expiresIn: '7d'});
    const compressedToken = lzString.compressToEncodedURIComponent(JSON.stringify({internalToken, firebaseToken}));

    // Return new Payload:
    return {compressedToken, authPayload};

} catch (err) {
    // Log & Return:
    logtail.warn(`[👤] Failed to get/create auth payload for user - See details..`, {err});
    return null
}}