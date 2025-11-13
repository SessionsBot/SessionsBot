import axios from "axios";
import { supabase } from "../../../../../utils/database/supabase.js";
import express from "express";
import logtail from "../../../../../utils/logs/logtail.js";
import core from "../../../../../utils/core.js";
import { APIUser, RESTGetAPICurrentUserGuildsResult } from "discord.js";
import { User } from "@supabase/supabase-js";
import { APIResponse as reply } from "../../../../utils/responder.js";
import verifyToken, { authorizedRequest } from "../../../../middleware/verifyToken.js";
import { DateTime } from "luxon";
import { AuthError, AuthErrorTypes } from "./authTypes.js";

// ! BEFORE PRODUCTION:
// - Switch over development tokens/keys/vars/etc.
const CLIENT_ID = process.env["DEV_CLIENT_ID"];
const CLIENT_SECRET = process.env["DEV_CLIENT_SECRET"];
const REDIRECT_URI = "https://api.sessionsbot.fyi/auth/discord-callback";
const BOT_ADMIN_UIDs = process.env["BOT_ADMIN_USER_IDS"]?.split(",") ?? [];

const stringTimestamp = () => DateTime.now().setZone('America/Chicago').toFormat('f');

const authRouter = express.Router({ mergeParams: true });
const frontendRedirects = {
    // ! BEFORE PRODUCTION:
    // authFailure: 'https://sessionsbot.fyi/sign-in?discordOauthError=true',
    authFailure: "http://localhost:5173/sign-in?discordOauthError=true",
};


// Sign In Endpoint - Initial Sign In w/ Discord:
authRouter.get("/discord-sign-in", async (req, res) => {
    // Redirect user to Discord oAuth:
    return res.redirect('https://discord.com/oauth2/authorize?client_id=1380300328179732500&response_type=code&redirect_uri=https%3A%2F%2Fapi.sessionsbot.fyi%2Fauth%2Fdiscord-callback&scope=identify+guilds+email');
});


// Discord oAuth Callback Endpoint - Redirect to after initial Discord sign in:
authRouter.get("/discord-callback", async (req, res) => {
    try {
        // 1. Get code/query from callback:
        const { code, error } = req.query;
        // If oAuth failed:
        if (!code || error) throw new AuthError('oAuth2');

        // 2. Exchange code for token:
        const tokenReq = await axios.post(
            "https://discord.com/api/oauth2/token",
            new URLSearchParams(<any>{
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "authorization_code",
                code: code,
                redirect_uri: REDIRECT_URI,
                scope: "identify guilds, email",
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded", } }
        );

        // 3. Get access/refresh tokens from Discord oAuth:
        const { data: { access_token, refresh_token } } = tokenReq;
        if (!access_token || !refresh_token) throw new AuthError('codeExchange');

        // 4. Get extra Discord data for user:
        const userResponse = await axios.get("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
        const userData: APIUser = userResponse?.data;
        if (!userData) throw new AuthError('fetchUser', { source: 'Discord user data fetch from token.' });
        const userDataMapped = {
            id: userData?.id,
            username: userData?.username,
            email: userData?.email,
            display_name: userData?.global_name,
            avatar: userData?.avatar
                ? `https://cdn.discordapp.com/avatars/${userData?.id}/${userData.avatar}.${userData.avatar.startsWith("a_") ? "gif" : "png"}`
                : `https://cdn.discordapp.com/embed/avatars/0.png`,
        };
        if (!userDataMapped.email) throw new AuthError('missingEmail');

        // 5. Get User's Guilds - Map:
        const botGuilds = await core.botClient.guilds.fetch();
        const botGuildsIds = botGuilds.map((g) => g.id);
        const ADMINISTRATOR = 0x00000008;
        const MANAGE_GUILD = 0x00000020;
        const guildsResponse = await axios.get("https://discord.com/api/users/@me/guilds", { headers: { Authorization: `Bearer ${access_token}` } });
        const guilds: RESTGetAPICurrentUserGuildsResult = guildsResponse.data;
        if (!guilds) throw new AuthError('fetchUser', { source: 'Discord user guilds data fetch from token.' });
        const userGuildsMapped = guilds.map((g) => ({
            id: g?.id,
            name: g?.name,
            icon: g?.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith("a_") ? "gif" : "png"}` : `https://cdn.discordapp.com/embed/avatars/0.png`,
            permissions: g?.permissions,
            memberCount: g?.approximate_member_count,
            hasSessionsBot: botGuildsIds.includes(g?.id),
        }));
        const manageableGuildsMapped = userGuildsMapped.filter((guild) => {
            const permissions = BigInt(guild?.["permissions_new"] ?? guild.permissions);
            return (permissions & BigInt(ADMINISTRATOR)) !== 0n || (permissions & BigInt(MANAGE_GUILD)) !== 0n;
        });

        // 6. Create/Find Supabase User for Authenticated Discord User:
        let userProfile = null;
        let authUser: User = null;
        const { data: existingProfile, error: profileFetchErr } = await supabase.from("profiles").select("*").eq("discord_id", userDataMapped.id).maybeSingle();
        if (profileFetchErr) throw new AuthError('fetchUser', { source: 'Failed to fetch existing profile from Supabase.', fetch_error: profileFetchErr });
        if (!existingProfile) { // No Profile - New User - Create:
            // Create new Auth User:
            const { data: { user: newUser }, error: createUserErr } = await supabase.auth.admin.createUser({
                email: userDataMapped.email,
                email_confirm: true,
                app_metadata: {
                    roles: ['user'],
                    last_synced: new Date().toISOString()
                },
                user_metadata: {
                    ...userDataMapped,
                    guilds: {
                        all: userGuildsMapped,
                        manageable: manageableGuildsMapped,
                    },
                },
            });
            if (createUserErr || !newUser) throw new AuthError('createUser', { error_details: createUserErr, source: 'Auth Users' });

            // Create new Auth Profile:
            const { data: newProfile, error: createProfileErr } = await supabase
                .from("profiles")
                .upsert({
                    id: newUser.id,
                    discord_id: userDataMapped.id,
                    email: userDataMapped.email,
                    username: userDataMapped.username,
                    discord_access_token: access_token,
                    discord_refresh_token: refresh_token,
                    discord_token_expires_at: new Date(Date.now() + tokenReq.data?.expires_in * 1000).toISOString(),
                    created_at: new Date().toISOString(),
                })
                .select();
            if (createProfileErr || !newProfile) throw new AuthError('createUser', { error_details: createProfileErr, source: 'User Profiles' });

            // Assign User
            userProfile = newProfile;
            authUser = newUser;

        } else { // Found Profile - Fetch User - Update:
            // Get Existing User:
            const userUid = existingProfile?.id;
            const isBotAdmin = BOT_ADMIN_UIDs.includes(userUid);
            const appRoles = ['user'];
            if (isBotAdmin) appRoles.push('admin');
            const { data: { user: existingUser }, error: getUserErr } = await supabase.auth.admin.getUserById(userUid);
            if (getUserErr) throw new AuthError('fetchUser', { source: 'Fetch user within auth from profile id.' });
            // Update profile:
            const updProfile = supabase
                .from("profiles")
                .update({
                    discord_id: userDataMapped.id,
                    email: userDataMapped.email,
                    username: userDataMapped.username,
                    discord_access_token: access_token,
                    discord_refresh_token: refresh_token,
                    discord_token_expires_at: new Date(Date.now() + tokenReq.data?.expires_in * 1000).toISOString(),
                })
                .eq("id", userUid)
                .select();
            // Update User
            const updUser = supabase.auth.admin.updateUserById(userUid, {
                email: userDataMapped.email,
                email_confirm: true,
                app_metadata: {
                    roles: appRoles,
                    last_synced: new Date().toISOString(),
                },
                user_metadata: {
                    ...userDataMapped,
                    guilds: {
                        all: userGuildsMapped,
                        manageable: manageableGuildsMapped,
                    }
                },
            });
            // Make Updates
            const [{ data: profileUpdData, error: profileUpdErr }, { data: userUpdData, error: userUpdErr }] = await Promise.all([updProfile, updUser]);
            if (profileUpdErr || userUpdErr) throw new AuthError('updateUser', { context: { userUid, profileUpdErr, userUpdErr } });

            // Assign User
            userProfile = profileUpdData?.[0] ?? existingProfile;
            authUser = userUpdData.user ?? existingUser;
        }
        if (!userProfile || !authUser) throw new AuthError('fetchUser', { source: "Failed to fetch either profile or user for authenticating user..", context: { userProfile, authUser } });

        // 7. Redirect user back to frontend with Magic Session Link:
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: authUser.email,
            options: {
                // ! BEFORE PRODUCTION - SWITCH TO FRONTEND URL:
                redirectTo: "http://localhost:5173/",
            },
        });
        if (linkErr || !linkData?.properties?.action_link) throw new AuthError('generateLink', { context: { linkData, linkErr } });

        // 8. Log & Redirect New Auth Session:
        logtail.log(`👤 - ${userData?.username} Authorized! - Direct oAuth2`, { user: userDataMapped, timestamp: stringTimestamp() });
        return res.redirect(linkData.properties.action_link);

    } catch (err) {
        // Log & Redirect to failed sign in page:
        if (err instanceof AuthError) {
            logtail.warn(`👤 - Auth FAILED - ${err.errorType} - see details`, { err, timestamp: stringTimestamp() });
            return res.redirect(frontendRedirects.authFailure + err.queryPath);
        } else {
            logtail.error(`👤 - Auth FAILED - UNKNOWN ERROR - see details`, { err, timestamp: stringTimestamp() });
            return res.redirect(frontendRedirects.authFailure + '&errorType=unknown');
        }
    }
});


// Discord Data Refresh Endpoint - "Silent" Discord auth/data refresh:
authRouter.get("/discord-refresh", verifyToken, async (req: authorizedRequest, res) => {
    try {
        // 1. Get Data/User from Req:
        const { auth: { user: reqUser, profile: reqUserProfile } } = req;
        const triggerType = req.headers['trigger-type'] || 'unknown trigger?';
        const isBotAdmin = BOT_ADMIN_UIDs.includes(reqUser.id);
        const appRoles = ['user'];
        if (isBotAdmin) appRoles.push('admin');

        // 2. Get Discord token data from profile:
        const { discord_refresh_token, discord_token_expires_at } = reqUserProfile
        if (!discord_refresh_token || !discord_token_expires_at) return new reply(res).failure('Failed to get refresh token/data for user, sign out and back in.');
        const tokenExpDate = DateTime.fromISO(discord_token_expires_at)
        const tokenExpired = tokenExpDate?.diffNow('seconds')?.seconds <= 0;
        if (!tokenExpDate || tokenExpired) return new reply(res).failure('Token has expired! You will have to sign back into Discord.')

        // 3. Exchange refresh token for fresh tokens:
        const tokenReq = await axios.post(
            "https://discord.com/api/oauth2/token",
            new URLSearchParams(<any>{
                client_id: CLIENT_ID,
                client_secret: CLIENT_SECRET,
                grant_type: "refresh_token",
                refresh_token: discord_refresh_token,
            }),
            { headers: { "Content-Type": "application/x-www-form-urlencoded", } }
        ).catch((err) => { throw new AuthError('codeExchange', { err }); });

        // 4. Get access/refresh tokens from Discord oAuth:
        const { data: { access_token, refresh_token } } = tokenReq;
        if (!access_token || !refresh_token) throw new AuthError('codeExchange');

        // 5. Get extra Discord data for user:
        const userResponse = await axios.get("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
        const userData: APIUser = userResponse?.data;
        if (!userData) throw new AuthError('fetchUser', { source: 'Discord user data fetch from token.' });
        const userDataMapped = {
            id: userData?.id,
            username: userData?.username,
            email: userData?.email,
            display_name: userData?.global_name,
            avatar: userData?.avatar
                ? `https://cdn.discordapp.com/avatars/${userData?.id}/${userData.avatar}.${userData.avatar.startsWith("a_") ? "gif" : "png"}`
                : `https://cdn.discordapp.com/embed/avatars/0.png`,
        };
        if (!userDataMapped.email) throw new AuthError('missingEmail');

        // 6. Get User's Guilds - Map:
        const botGuilds = await core.botClient.guilds.fetch();
        const botGuildsIds = botGuilds.map((g) => g.id);
        const ADMINISTRATOR = 0x00000008;
        const MANAGE_GUILD = 0x00000020;
        const guildsResponse = await axios.get("https://discord.com/api/users/@me/guilds", { headers: { Authorization: `Bearer ${access_token}` } });
        const guilds: RESTGetAPICurrentUserGuildsResult = guildsResponse.data;
        if (!guilds) throw new AuthError('fetchUser', { source: 'Discord user guilds data fetch from token.' });
        const userGuildsMapped = guilds.map((g) => ({
            id: g?.id,
            name: g?.name,
            icon: g?.icon ? `https://cdn.discordapp.com/icons/${g.id}/${g.icon}.${g.icon.startsWith("a_") ? "gif" : "png"}` : `https://cdn.discordapp.com/embed/avatars/0.png`,
            permissions: g?.permissions,
            memberCount: g?.approximate_member_count,
            hasSessionsBot: botGuildsIds.includes(g?.id),
        }));
        const manageableGuildsMapped = userGuildsMapped.filter((guild) => {
            const permissions = BigInt(guild?.["permissions_new"] ?? guild.permissions);
            return (permissions & BigInt(ADMINISTRATOR)) !== 0n || (permissions & BigInt(MANAGE_GUILD)) !== 0n;
        });

        // 7. Update Auth User and User Profile:
        const updProfile = supabase.from('profiles').update({
            discord_id: userDataMapped.id,
            email: userDataMapped.email,
            username: userDataMapped.username,
            discord_access_token: access_token,
            discord_refresh_token: refresh_token,
            discord_token_expires_at: new Date(Date.now() + tokenReq.data?.expires_in * 1000).toISOString(),

        }).eq("id", reqUser.id).limit(1).select().single()

        const updAuthUser = supabase.auth.admin.updateUserById(req?.auth?.user?.id, {
            email: userDataMapped.email,
            email_confirm: true,
            app_metadata: {
                roles: appRoles,
                last_synced: new Date().toISOString(),
            },
            user_metadata: {
                ...userDataMapped,
                guilds: {
                    all: userGuildsMapped,
                    manageable: manageableGuildsMapped,
                }
            },
        })

        // 8. Make Updates:
        const [{ error: updProfileErr }, { error: updAuthUserErr, data: { user: authUserUpd } }] = await Promise.all([updProfile, updAuthUser])
        if (updProfileErr) throw new AuthError('updateUser', { source: "Updating User Profile - Refresh", err: updProfileErr });
        if (updAuthUserErr) throw new AuthError('updateUser', { source: "Updating Auth User - Refresh", err: updAuthUserErr });

        // 9. Create MagicLink - Extract new JWT for user:
        const { error: magicLinkERR, data: { properties: { hashed_token }, user: magicUser } } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: userData.email,
        })
        if (magicLinkERR || !hashed_token) throw new AuthError('generateLink', { err: magicLinkERR });

        // 10. Return Success - Fresh Token:
        logtail.log(`👤 - ${userData?.username} Refreshed Auth Data! - ${triggerType}`, { user: userDataMapped, timestamp: stringTimestamp() });
        return new reply(res).success({ fresh_token: hashed_token });

    } catch (err) {
        logtail.warn(`👤 -  Auth Refresh Failed - See Details`, { err, timestamp: stringTimestamp() });
        return new reply(res).failure('Failed to update user data from Discord! Sign out and back in...');
    }
});

export default authRouter;
