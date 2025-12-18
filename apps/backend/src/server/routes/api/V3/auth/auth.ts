import axios from "axios";
import { supabase } from "../../../../../utils/database/supabase.js";
import express from "express";
import logtail from "../../../../../utils/logs/logtail.js";
import { APIResponse as reply } from "@sessionsbot/shared";
import verifyToken, { authorizedRequest } from "../../../../middleware/verifyToken.js";
import { DateTime } from "luxon";
import { AuthError } from "./authErrTypes.js";
import { fetchUserDiscordData, updateAuthUser } from "./authUtils.js";

// ! BEFORE PRODUCTION:
// - Switch over development tokens/keys/vars/etc.
const CLIENT_ID = process.env["DEV_CLIENT_ID"];
const CLIENT_SECRET = process.env["DEV_CLIENT_SECRET"];
const REDIRECT_URI = "https://api.sessionsbot.fyi/auth/discord-callback";

const stringTimestamp = () => DateTime.now().setZone('America/Chicago').toFormat('f');

const authRouter = express.Router({ mergeParams: true });
const frontendRedirects = {
    // ! BEFORE PRODUCTION:
    // authFailure: 'https://sessionsbot.fyi/sign-in?discordOauthError=true',
    authFailure: "http://localhost:5173/sign-in?discordOauthError=true",
};


// Sign In Endpoint - REDIRECT - Initial Sign In w/ Discord:
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
        const { data: { access_token: accessToken, refresh_token: refreshToken, expires_in: tokenExpMs } } = tokenReq;
        if (!accessToken || !refreshToken || !tokenExpMs) throw new AuthError('codeExchange', { accessToken, refreshToken, tokenExpMs });

        // 4. Retrieve Discord data from access token:
        const dataResult = await fetchUserDiscordData(accessToken);
        if (dataResult instanceof AuthError) throw dataResult;
        const { user: userData, guilds: guildsData } = dataResult;

        // 5. Create/Update User & Profile within DB:
        const saveResult = await updateAuthUser(userData, guildsData, accessToken, refreshToken, tokenExpMs);
        if (saveResult instanceof AuthError) throw saveResult;
        const { user, profile } = saveResult;

        // 6. Redirect user back to frontend with Magic Session Link:
        const { data: linkData, error: linkErr } = await supabase.auth.admin.generateLink({
            type: "magiclink",
            email: user.email,
            options: {
                // ! BEFORE PRODUCTION - SWITCH TO FRONTEND URL:
                redirectTo: "http://localhost:5173/",
            },
        });
        if (linkErr || !linkData?.properties?.action_link) throw new AuthError('generateLink', { context: { linkData, linkErr } });

        // 7. Log & Redirect New Auth Session:
        logtail.log(`👤 - ${userData?.username} Authorized! - Direct oAuth2`, { user: userData, timestamp: stringTimestamp() });
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

        // 2. Get PREV Discord token data from profile:
        const { discord_refresh_token, discord_token_expires_at } = reqUserProfile
        // Confirm token is available:
        if (!discord_refresh_token || !discord_token_expires_at) return new reply(res).failure('Failed to get refresh token/data for user, sign out and back in.');
        const tokenExpDate = DateTime.fromISO(discord_token_expires_at)
        const tokenExpired = tokenExpDate?.diffNow('seconds')?.seconds <= 0;
        // Confirm token hasn't expired:
        if (!tokenExpDate || tokenExpired) return new reply(res).failure('Token has expired! You will have to sign back into Discord.')

        // 3. Exchange refresh token for FRESH tokens:
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
        const { data: { access_token: accessToken, refresh_token: refreshToken, expires_in: tokenExpMs } } = tokenReq;
        if (!accessToken || !refreshToken || !tokenExpMs) throw new AuthError('codeExchange', { accessToken, refreshToken, tokenExpMs });

        // 5. Retrieve FRESH Discord data from access token:
        const dataResult = await fetchUserDiscordData(accessToken);
        if (dataResult instanceof AuthError) throw dataResult;
        const { user: userData, guilds: guildsData } = dataResult;

        // 6. Create/Update User & Profile within DB:
        const saveResult = await updateAuthUser(userData, guildsData, accessToken, refreshToken, tokenExpMs);
        if (saveResult instanceof AuthError) throw saveResult;
        const { user, profile } = saveResult;

        // 7. Create MagicLink - Extract new JWT for user:
        const { error: magicLinkERR, data: { properties: { hashed_token } } } = await supabase.auth.admin.generateLink({
            type: 'magiclink',
            email: user.email,
        })
        if (magicLinkERR || !hashed_token) throw new AuthError('generateLink', { err: magicLinkERR });

        // 8. Return Success - Fresh Token:
        logtail.log(`👤 - ${userData?.username} Refreshed Auth Data! - ${triggerType}`, { user: userData, timestamp: stringTimestamp() });
        return new reply(res).success({ fresh_token: hashed_token });

    } catch (err) {
        // Log & Return - Refresh Error:
        logtail.warn(`👤 -  Auth Refresh Failed - See Details`, { err, timestamp: stringTimestamp() });
        return new reply(res).failure('Failed to update/refresh user data from Discord! Sign out and back in...');
    }
});


export default authRouter;
