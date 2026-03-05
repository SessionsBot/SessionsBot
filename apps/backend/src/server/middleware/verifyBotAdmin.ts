import { NextFunction, Request, Response } from "express";
import { APIResponse as Reply } from "../routes/api/V3/utils/responseClass";
import { HttpStatusCode } from "axios";
import { useLogger } from "../../utils/logs/logtail";

const createLog = useLogger()

/** Verifies that the authenticated user from request is a **DEDICATED BOT ADMIN**.
 * @prerequisites `verifyToken()` --> an authorized request */
export const verifyBotAdmin = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const botAdminIds = process.env?.['BOT_ADMIN_DISCORD_IDS']?.split(',')
        const userDiscordId = req?.auth?.profile?.discord_id
        if (!userDiscordId) return new Reply(res).failure(`Unauthorized Bot Admin - Missing Auth Token / Data`, HttpStatusCode.Unauthorized)
        if (!botAdminIds.includes(userDiscordId)) return new Reply(res).failure(`Unauthorized Bot Admin - You're not an admin user!`, HttpStatusCode.Forbidden)
        else next()
    } catch (err) {
        createLog.for('Api').error(`FAILED - Verifying a BOT Admin! - Username: ${req?.auth?.profile?.username ?? 'Not Provided'}`, { userId: req?.auth?.profile?.discord_id, error: err })
        return new Reply(res).failure(`Unauthorized Bot Admin - INTERNAL ERROR!`)
    }
}