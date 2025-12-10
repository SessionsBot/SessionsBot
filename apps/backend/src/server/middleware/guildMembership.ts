import { NextFunction, Request, Response } from "express"
import { APIResponse } from "@sessionsbot/shared";
import { HttpStatusCode } from "axios";
import core from "../../utils/core.js";
import logtail from "../../utils/logs/logtail";
import { authorizedRequest } from "./verifyToken.js";


/** Verifies that the authenticated user from request is a member of the Discord Guild.*/
const verifyGuildMember = async (req: authorizedRequest, res: Response, next: NextFunction) => {
    try {
        // Get user & guild from request:
        const guildId = req.params?.guildId;
        const userId = req?.auth.user.user_metadata.id // Discord ID
        if (!guildId) return new APIResponse(res).sendFailure(`Bad Request - Couldn't verify guild membership, a guild id was unprovided.`, 400);
        if (!userId) return new APIResponse(res).sendFailure(`Internal Error - Couldn't access authed user from req data.`);

        // Check if user is member:
        const guild = await core.botClient.guilds.fetch(guildId);
        if (!guild) return new APIResponse(res).sendFailure(`Internal Error - Failed to fetch guild to confirm user is member. - ${guildId}`);
        const member = await guild.members.fetch(userId);
        if (!member) return new APIResponse(res).sendFailure(`Invalid Permissions - You're not a member of this guild(${guildId}).`, HttpStatusCode.Unauthorized);
        else return next() // allowed

    } catch (err) {
        // Log & return error:
        logtail.warn(`[🔑] FAILED to verify guild membership for API request - See details...`, { err, user: req?.auth.user, guildId: req?.params?.guildId });
        return new APIResponse(res).sendFailure(`Internal Error - Failed to fetch guild to confirm user is member. - ${req?.params?.guildId}`);
    }
}

/** Verifies that the authenticated user from request is a ADMIN member of the Discord Guild.*/
const verifyGuildAdmin = async (req: authorizedRequest, res: Response, next: NextFunction) => {
    try {
        // Get user & guild from request:
        const guildId = req.params?.guildId;
        const userId = req?.auth.user.user_metadata.id // Discord ID
        if (!guildId) return new APIResponse(res).sendFailure(`Bad Request - Couldn't verify guild membership, a guild id was unprovided.`, 400);
        if (!userId) return new APIResponse(res).sendFailure(`Internal Error - Couldn't access authed user from req data.`);

        // Check if user is member:
        const guild = await core.botClient.guilds.fetch(guildId);
        if (!guild) return new APIResponse(res).sendFailure(`Internal Error - Failed to fetch guild to confirm user is member. - ${guildId}`);
        const member = await guild.members.fetch(userId);
        if (!member) return new APIResponse(res).sendFailure(`Invalid Permissions - You're not a member of this guild(${guildId})!`, HttpStatusCode.Unauthorized);

        // Confirm Requires Perms Granted:
        if (member.permissions.has("ManageGuild") || member.permissions.has("Administrator")) return next(); // allowed
        else return new APIResponse(res).sendFailure(`Invalid Permissions - You're not an admin member of this guild(${guildId})!`, HttpStatusCode.Unauthorized);

    } catch (err) {
        // Log & return error:
        logtail.warn(`[🔑] FAILED to verify guild membership for API request - See details...`, { err, user: req?.auth.user, guildId: req?.params?.guildId });
        return new APIResponse(res).sendFailure(`Internal Error - Failed to fetch guild to confirm user is member. - ${req?.params?.guildId}`);
    }
}

export {
    verifyGuildMember,
    verifyGuildAdmin
}