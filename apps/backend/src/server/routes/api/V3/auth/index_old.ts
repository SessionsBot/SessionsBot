import express from "express"
import { APIResponse } from "../../../../utils/responder.js"
import core from "../../../../../utils/core.js";
import axios, { HttpStatusCode } from "axios";
import logtail from "../../../../../utils/logs/logtail.js";
import { verifyToken } from "../../../../middleware/verifyToken.js";
import { AuthedRequest } from "../../../../../utils/types/authedRequest.js";
import { getRefreshToken, newAuthPayload } from "./authData.js";
import { DateTime } from "luxon";
import { string } from "zod";

const authRouter = express.Router({mergeParams: true});

// Env Variables:
const ENVIRONMENT = process.env?.['ENVIRONMENT'];
const production = ENVIRONMENT !== 'development';
const CLIENT_ID = process.env?.[production ? 'DISCORD_CLIENT_ID': 'DEV_CLIENT_ID'];
const CLIENT_SECRET = process.env?.[production ? 'DISCORD_CLIENT_SECRET': 'DEV_CLIENT_SECRET'];
const REDIRECT_URI = ( (production ? 'https://api.sessionsbot.fyi' : 'http://localhost:3000') + '/api/v3/auth/discord-redirect')


// Initial Auth Grant - Fresh Sign In:
authRouter.get(`/discord-redirect`, async (req, res) => {try {
    // Exchange auth code for token(s):
    const {code, error} = req?.query;
    if(error) throw error;
    if(!code) throw 'No Discord oAuth2 Grant Code Provided!';
    const tokenRequest = await axios.post(
        `https://discord.com/api/oauth2/token`, 
        new URLSearchParams(<any>{
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "authorization_code",
            code,
            redirect_uri: REDIRECT_URI,
        }), 
        {headers: { "Content-Type": "application/x-www-form-urlencoded" }}
    );
    const {access_token, refresh_token} = tokenRequest.data;
    if (!access_token || !refresh_token) throw["Failed to obtain access tokens from Discord!", tokenRequest];

    const {authPayload, compressedToken} = await newAuthPayload(access_token, refresh_token);
    if(!authPayload || !compressedToken) return new APIResponse(res).sendFailure('Failed to get authentication data/payload for user!');
    
    // Return to frontend with auth token(s):
    logtail.info(`[👤] Authenticated user! - ${authPayload?.username}`, {authPayload});
    return res.redirect(core.urls.mainSite + `/auth/callback?token=${compressedToken}`);

} catch (err) {
    // Log Error:
    logtail.warn(`[👤] Failed to auth user! See details`, {err});
    
    // Redirect to frontend with alert:
    return res.redirect(core.urls.mainSite + `/auth/callback?failed=true`);
}})


// Re-Sync/Auth Discord Data - Extend Auth Session:
const refreshCooldown = {
    lastAuthDates:<{[userId: string]: DateTime}> {},
    saveNewRefresh: (userId:string) => {
        refreshCooldown.lastAuthDates[userId] = DateTime.now()
    },
    canReAuth: (userId:string) => {
        const usersLastAuthData = refreshCooldown.lastAuthDates[userId];
        const difNow = Math.abs(usersLastAuthData.diffNow('minutes').minutes || 5);
        const allowed = difNow >= 5;
        return allowed
    },

}
authRouter.get(`/refresh`, verifyToken, async (req:AuthedRequest, res) => {try {
    // Check Cooldown:
    const userId = req?.user?.id
    if(!refreshCooldown.canReAuth(userId)) return new APIResponse(res).sendFailure(`Slow Down! - You need to wait a while between each auth refresh!`, 429)

    // Get / fetch user auth codes from request:
    
    const pastRefreshToken = await getRefreshToken(userId);
    if(!pastRefreshToken) return new APIResponse(res).sendFailure('Failed to find refresh token for user!', HttpStatusCode.NotFound);

    // Get fresh tokens from Discord:
    const tokenResponse = await axios.post(
        "https://discord.com/api/oauth2/token",
        new URLSearchParams({
            client_id: CLIENT_ID,
            client_secret: CLIENT_SECRET,
            grant_type: "refresh_token",
            refresh_token: pastRefreshToken,
        }),
        { headers: { "Content-Type": "application/x-www-form-urlencoded" } }
    );
    const {access_token, refresh_token} = tokenResponse.data;
    if(!access_token || !refresh_token) return new APIResponse(res).sendFailure('Failed to get fresh tokens for user!');

    // Get fresh auth payload:
    const {authPayload, compressedToken} = await newAuthPayload(access_token, refresh_token);
    if(!authPayload || !compressedToken) return new APIResponse(res).sendFailure('Failed to get refreshed auth data/payload for user!');
    
    // Log & return success:
    logtail.info(`[👤] Re-Authenticated user! - ${authPayload?.username}`, {authPayload});
    return new APIResponse(res).sendSuccess({compressedToken})

} catch (err) {
    // Log & return failure:
    logtail.warn(`[👤] Failed to re-auth user! - See details`, {err, user: req?.user});
    return new APIResponse(res).sendFailure('Internal Error - Failed to refresh auth for user!');
}})

export default authRouter