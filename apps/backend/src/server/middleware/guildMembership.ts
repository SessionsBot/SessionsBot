import { NextFunction, Request, Response } from "express"
import { APIResponse } from "@sessionsbot/shared";
import { HttpStatusCode } from "axios";
import core from "../../utils/core/core.js";
import { useLogger } from "../../utils/logs/logtail";
import { authorizedRequest } from "./verifyToken.js";

const createLog = useLogger();

/** Verifies that the authenticated user from request is a member of the Discord Guild.*/
const verifyGuildMember = async (req: authorizedRequest, res: Response, next: NextFunction) => {
    try {
        // Get user & guild from request:
        const guildId = req.params?.guildId.toString();
        const userId = req?.auth.user.user_metadata.id // Discord ID
        if (!guildId) return new APIResponse(res).failure(`Bad Request - Couldn't verify guild membership, a guild id was unprovided.`, 400);
        if (!userId) return new APIResponse(res).failure(`Internal Error - Couldn't access authed user from req data.`);

        // Check if user is member:
        const guild = await core.botClient?.guilds.fetch(guildId);
        if (!guild) return new APIResponse(res).failure(`Internal Error - Failed to fetch guild to confirm user is member. - ${guildId}`);
        const member = await guild.members.fetch(userId);
        if (!member) return new APIResponse(res).failure(`Invalid Permissions - You're not a member of this guild(${guildId}).`, HttpStatusCode.Unauthorized);
        else return next() // allowed

    } catch (err) {
        // Log & return error:
        createLog.for('Api').warn(`[🔑] FAILED to verify guild membership for API request - See details...`, {
            err,
            userId: req?.auth.user.id,
            username: req?.auth?.user?.user_metadata?.username,
            userGuildsMeta: req?.auth.user.user_metadata.guilds.all,
            guildId: req?.params?.guildId,
            route: req.originalUrl
        });
        return new APIResponse(res).failure(`Internal Error - Failed to fetch guild to confirm user is member. - ${req?.params?.guildId}`);
    }
}

/** Verifies that the authenticated user from request is a ADMIN member of the Discord Guild.
 * @IMPORTANT **Relies on:**
 * - verifyToken being called before `this`
 * - `guildId` available within req params 
*/
const verifyGuildAdmin = async (req: authorizedRequest, res: Response, next: NextFunction) => {
    try {
        // Get user & guild from request:
        const guildId = req.params?.guildId?.toString();
        const userId = req?.auth?.user?.user_metadata?.id // Discord ID
        if (!guildId) return new APIResponse(res).failure(`Bad Request - Couldn't verify guild membership, a guild id was unprovided.`, 400);
        if (!userId) return new APIResponse(res).failure(`Internal Error - Couldn't access authed user from req data.`);

        // Check if user is member:
        const guild = await core.botClient?.guilds.fetch(guildId);
        if (!guild) return new APIResponse(res).failure(`Internal Error - Failed to fetch guild to confirm user is member. - ${guildId}`);
        const member = await guild.members.fetch(userId);
        if (!member) return new APIResponse(res).failure(`Invalid Permissions - You're not a member of this guild(${guildId})!`, HttpStatusCode.Unauthorized);

        // Confirm Requires Perms Granted:
        if (member.permissions.has("ManageGuild") || member.permissions.has("Administrator")) return next(); // allowed
        else return new APIResponse(res).failure(`Invalid Permissions - You're not an admin member of this guild(${guildId})!`, HttpStatusCode.Unauthorized);

    } catch (err) {
        // Log & return error:
        createLog.for('Api').warn(`[🔑] FAILED to verify guild membership for API request - See details...`, {
            err,
            userId: req?.auth.user.id,
            username: req?.auth?.user?.user_metadata?.username,
            userGuildsMeta: req?.auth.user.user_metadata.guilds,
            guildId: req?.params?.guildId,
            route: req.originalUrl
        });
        return new APIResponse(res).failure(`Internal Error - Failed to fetch guild to confirm user is member. - ${req?.params?.guildId}`);
    }
}

export {
    verifyGuildMember,
    verifyGuildAdmin
}