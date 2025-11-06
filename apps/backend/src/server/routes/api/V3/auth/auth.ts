import axios from "axios";
import { supabase } from "../../../../../utils/database/supabase";
import express from "express";
import logtail from "../../../../../utils/logs/logtail";
import core from "../../../../../utils/core";
import { APIUser, RESTGetAPICurrentUserGuildsResult } from "discord.js";
import { User } from "@supabase/supabase-js";

/**
 *+ [ NOTES ]
 *  Alter the api.sessionsbot.fyi redirect to auto include the /api path...
 *  - hosted on https://redirect.pizza
 *  - keep in mind: new api routes
 *  -- no longer includes /api or /vX
 */

const CLIENT_ID = process.env["DEV_CLIENT_ID"];
const CLIENT_SECRET = process.env["DEV_CLIENT_SECRET"];
const REDIRECT_URI = "http://localhost:3000/api/auth/discord-callback";

const authRouter = express.Router({ mergeParams: true });
const frontendRedirects = {
    authSuccess: "https://sessionsbot.fyi",
    // authFailure: 'https://sessionsbot.fyi/sign-in?discordOauthError=true',
    authFailure: "http://localhost:3000/auth-error",
};

// Sign In Endpoint - Initial Sign In w/ Discord:
authRouter.get("/discord-sign-in", async (req, res) => {
    // Redirect user to Discord oAuth:
    // ! FIX ME: DEV TESTING CALLBACK URL:
    return res.redirect(
        "https://discord.com/oauth2/authorize?client_id=1380300328179732500&response_type=code&redirect_uri=http%3A%2F%2Flocalhost%3A3000%2Fapi%2Fauth%2Fdiscord-callback&scope=identify+guilds+email"
    );
});

// Discord oAuth Callback Endpoint - Redirect to after initial Discord sign in:
authRouter.get("/discord-callback", async (req, res) => {
    try {
        // 1. Get code/query from callback:
        const { code, error } = req.query;
        // If oAuth failed:
        if (!code || error) {
            return res.redirect(frontendRedirects.authFailure);
        }

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
            {
                headers: {
                    "Content-Type": "application/x-www-form-urlencoded",
                },
            }
        );

        // 3. Get access/refresh tokens from Discord oAuth:
        const {
            data: { access_token, refresh_token },
        } = tokenReq;
        if (!access_token || !refresh_token) {
            logtail.warn(`👤 - Auth FAILED - Couldn't fetch access/refresh tokens...`, { tokenReq });
            return res.redirect(frontendRedirects.authFailure);
        }

        // 4. Get extra Discord data for user:
        const userResponse = await axios.get("https://discord.com/api/users/@me", { headers: { Authorization: `Bearer ${access_token}` } });
        const userData: APIUser = userResponse?.data;
        if (!userData) throw { message: "Failed to fetch authenticating users Discord data!" };
        const userDataMapped = {
            id: userData?.id,
            username: userData?.username,
            email: userData?.email,
            display_name: userData?.global_name,
            avatar: userData?.avatar
                ? `https://cdn.discordapp.com/avatars/${userData?.id}/${userData.avatar}.${userData.avatar.startsWith("a_") ? "gif" : "png"}`
                : `https://cdn.discordapp.com/embed/avatars/0.png`,
        };

        // 5. Get User's Guilds Data:
        const botGuilds = await core.botClient.guilds.fetch();
        const botGuildsIds = botGuilds.map((g) => g.id);
        const ADMINISTRATOR = 0x00000008;
        const MANAGE_GUILD = 0x00000020;
        const guildsResponse = await axios.get("https://discord.com/api/users/@me/guilds", { headers: { Authorization: `Bearer ${access_token}` } });
        const guilds: RESTGetAPICurrentUserGuildsResult = guildsResponse.data;
        if (!guilds) throw { message: "Failed to fetch authenticating users Discord guilds!" };
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
        const { data: existingProfile, error: profileFetchErr } = await supabase.from("profiles").select("*").eq("discord_id", userDataMapped.id).single();
        if (profileFetchErr) throw ["Failed to fetch existing profiles for oAuth", existingProfile];
        if (!existingProfile) { // No Profile - New User - Create:
            // Create new Auth User:
            const {
                data: { user: newUser },
                error: createUserErr,
            } = await supabase.auth.admin.createUser({
                email: userDataMapped.email,
                email_confirm: true,
                user_metadata: {
                    ...userDataMapped,
                    guilds: {
                        all: userGuildsMapped,
                        manageable: manageableGuildsMapped,
                    },
                },
            });
            if (createUserErr || !newUser) throw ["Failed to create new auth user!", { createUserErr, newUser }];

            // Create new Auth Profile:
            const { data: newProfile, error: createProfileErr } = await supabase
                .from("profiles")
                .upsert({
                    id: newUser.id,
                    discord_id: userDataMapped.id,
                    email: userDataMapped.email,
                    username: userDataMapped.username,
                    display_name: userDataMapped.display_name,
                    avatar: userDataMapped.avatar,
                    discord_access_token: access_token,
                    discord_refresh_token: refresh_token,
                    discord_token_expires_at: new Date(Date.now() + tokenReq.data?.expires_in * 1000).toISOString(),
                    last_synced: new Date().toISOString(),
                    created_at: new Date().toISOString(),
                })
                .select();
            if (createProfileErr || !newProfile) throw ["Failed to create new profile for user!", { createProfileErr, newProfile }];

            // Assign User
            userProfile = newProfile;
            authUser = newUser;

        } else { // Found Profile - Fetch User - Update:
            const userUid = existingProfile?.id;
            const {
                data: { user: existingUser },
                error: getUserErr,
            } = await supabase.auth.admin.getUserById(userUid);
            if (getUserErr) throw ["Failed to fetch existing user from profile id within auth!", { getUserErr, userUid }];
            // Update profile:
            const updProfile = supabase
                .from("profiles")
                .update({
                    discord_id: userDataMapped.id,
                    email: userDataMapped.email,
                    username: userDataMapped.username,
                    display_name: userDataMapped.display_name,
                    avatar: userDataMapped.avatar,
                    discord_access_token: access_token,
                    discord_refresh_token: refresh_token,
                    discord_token_expires_at: new Date(Date.now() + tokenReq.data?.expires_in * 1000).toISOString(),
                    last_synced: new Date().toISOString(),
                })
                .eq("id", userUid)
                .select();
            // Update User
            const updUser = supabase.auth.admin.updateUserById(userUid, {
                user_metadata: {
                    ...userDataMapped,
                    guilds: {
                        all: userGuildsMapped,
                        manageable: manageableGuildsMapped,
                    },
                },
            });
            // Make Updates
            const [{ data: profileUpdData, error: profileUpdErr }, { data: userUpdData, error: userUpdErr }] = await Promise.all([updProfile, updUser]);
            if (profileUpdErr || userUpdErr) throw ["Failed to make user updates during oAuth!", { userUid, profileUpdErr, userUpdErr }];

            // Assign User
            userProfile = existingProfile;
            authUser = existingUser;
        }
        if (!userProfile || !authUser) throw ["Failed to fetch either profile or user for authenticating user..", { userProfile, authUser }];

        // 7. Redirect user back to frontend with Magic Session Link:
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: authUser.email,
            options: {
                redirectTo: "http://localhost:5173/",
            },
        });
        if (linkErr || !linkData?.properties?.action_link) throw ["Failed to generate login link!", { linkErr, linkData }];

        // 8. Log & Redirect New Auth Session:
        logtail.warn(`👤 - ${userData?.username} Authorized! - Direct oAuth2`, { user: userDataMapped });
        return res.redirect(linkData.properties.action_link);
    } catch (err) {
        // Log & Return Error:
        logtail.warn(`👤 - Auth FAILED - See Details..`, { err });
        return res.redirect(frontendRedirects.authFailure);
    }
});


// Discord Data Refresh Endpoint - "Silent" Discord auth/data refresh:
authRouter.get("/discord-refresh", async (req, res) => {

});

export default authRouter;
