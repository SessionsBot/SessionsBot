import { NextFunction, Response } from "express"
import { APIResponse } from "../routes/api/V3/responseClass.js";
import { HttpStatusCode } from "axios";
import core from "../../utils/core/core.js";
import { useLogger } from "../../utils/logs/logtail";
import { authorizedRequest } from "./verifyToken.js";

// Log Util:
const createLog = useLogger();


/** Verifies that the authenticated user from request is a member of the Discord Guild.
 * @param `requireAdmin` Confirm that this user either has `ManageGuild` or `Administrator` permission within this guild.
 * @required `:guildId` param provided in route
 * @prerequisites `verifyToken()` --> `authorizedRequest` */
export const verifyGuildMember = (requireAdmin: boolean) => {
    return async (req: authorizedRequest, res: Response, next: NextFunction) => {
        try {
            // Get user & guild from request:
            const guildId = req.params?.guildId?.toString();
            const userId = req?.auth?.profile?.discord_id // Discord ID from authed token -> db -> api (secure?)
            if (!guildId) return new APIResponse(res).failure(`Bad Request - Couldn't verify guild membership, a guild id was unprovided.`, 400);
            if (!userId) return new APIResponse(res).failure(`Internal Error - Couldn't access authed user from req data.`, 500);

            // Get/Fetch Guild:
            let guild = core.botClient.guilds.cache.get(guildId);
            if (!guild) {
                guild = await core.botClient.guilds.fetch(guildId);
            }
            if (!guild) return new APIResponse(res).failure(`Internal Error - Failed to fetch guild to confirm user is member. - ${guildId}`, 500);
            // Fetch Guild Member:
            const member = await guild?.members?.fetch(userId);
            if (!member) return new APIResponse(res).failure(`Invalid Permissions - You're not a member of this guild(${guildId}).`, HttpStatusCode.Forbidden);

            // If Admin Permissions Required - Check:
            if (requireAdmin) {
                // Check Permissions:
                if (member?.permissions?.has("ManageGuild") || member?.permissions?.has("Administrator")) return next(); // allowed
                else return new APIResponse(res).failure(`Invalid Permissions - You're not an admin member of this guild(${guildId})!`, HttpStatusCode.Forbidden);
            } else {
                return next() // allowed
            }


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
}
