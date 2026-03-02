import express from 'express';
import { verifyGuildMember } from '../../../../../middleware/guildMembership';
import verifyToken from '../../../../../middleware/verifyToken';
import { APIResponse as reply } from '../../utils/responseClass';
import { useLogger } from '../../../../../../utils/logs/logtail';
import * as z from 'zod';
import { HttpStatusCode } from 'axios';
import dbManager from '../../../../../../utils/database/manager';
import { DateTime } from 'luxon';
import { supabase } from '../../../../../../utils/database/supabase';

const createdLog = useLogger();


const sessionRouter = express.Router({ mergeParams: true });


// POST - Delay Session
// URL: https://api.sessionsbot.fyi/guilds/:guildId/sessions/:sessionId/delay
sessionRouter.post(`/:sessionId/delay`, verifyToken, verifyGuildMember(true), async (req, res) => {
    try {
        // Parse Req:
        const guildId = String(req.params['guildId'])
        const sessionId = String(req.params['sessionId'])
        const actingUserId = req?.auth?.profile?.discord_id;
        const validSessionId = z.uuid().safeParse(sessionId, { reportInput: true })
        if (!validSessionId.success) return new reply(res).failure('Invalid Session Id Provided!', HttpStatusCode.BadRequest)
        const { new_start_iso, reason } = req.body
        const validReqBody = z.object({
            reason: z.nullish(z.string().max(100)),
            new_start_iso: z.string().refine(
                (val) => { return DateTime.fromISO(val)?.isValid },
                "Invalid ISO datetime!"
            )
        }).safeParse({
            new_start_iso, reason
        })
        if (!validReqBody.success) return new reply(res).failure({ message: 'Invalid Body Provided!', errs: z.treeifyError(validReqBody.error)?.properties }, HttpStatusCode.BadRequest)

        // Fetch Existing Session:
        const { data: sessionFetch, error: fetchErr } = await supabase.from('sessions').select('*')
            .eq('id', sessionId)
            .neq('status', 'canceled')
            .single()
        if (fetchErr) throw fetchErr
        if (!sessionFetch) throw 'Session fetch returned null - not found!'

        const existingStartUTC = DateTime.fromISO(sessionFetch?.starts_at_utc, { zone: 'utc' })
        const nowUTC = DateTime.utc()

        // Attempt session delay:
        const newStartDT = DateTime.fromISO(validReqBody.data.new_start_iso, { zone: 'utc' })
        const newStartINVALID = (newStartDT < existingStartUTC || newStartDT < nowUTC)
        if (newStartINVALID) return new reply(res).failure('Invalid Delay Time! New session start date must be AFTER existing start date and in future.', HttpStatusCode.BadRequest)

        const result = await dbManager.sessions.delay(guildId, sessionId, newStartDT, actingUserId, validReqBody.data?.reason ?? null)

        // Return results:
        if (result.success) {
            return new reply(res).success({ message: 'Successfully delayed session!' })
        } else {
            return new reply(res).failure('Failed to delay session! - Unknown')
        }
    } catch (error) {
        // Log & Return Failure:
        createdLog.for('Api').error('INTERNAL ERROR - Delay Session Endpoint ERR - See Details..', { error })
        return new reply(res).failure('Failed to delay session! - Internal Error - Unknown')
    }
})



// POST - Cancel Session
// URL: https://api.sessionsbot.fyi/guilds/:guildId/sessions/:sessionId/cancel
sessionRouter.post(`/:sessionId/cancel`, verifyToken, verifyGuildMember(true), async (req, res) => {
    try {
        // Parse Req:
        const guildId = String(req.params['guildId'])
        const sessionId = String(req.params['sessionId'])
        const actingUserId = req?.auth?.profile?.discord_id;
        const validSessionId = z.uuid().safeParse(sessionId, { reportInput: true })
        if (!validSessionId.success) return new reply(res).failure('Invalid Session Id Provided!', HttpStatusCode.BadRequest)
        const { reason } = req.body
        const validReqBody = z.object({
            reason: z.nullish(z.string().max(100)),
        }).safeParse({
            reason
        })
        if (!validReqBody.success) return new reply(res).failure({ message: 'Invalid Body Provided!', errs: z.treeifyError(validReqBody.error)?.properties }, HttpStatusCode.BadRequest)

        // Fetch Existing Session:
        const { data: sessionFetch, error: fetchErr } = await supabase.from('sessions').select('*')
            .eq('id', sessionId)
            .neq('status', 'canceled')
            .single()
        if (fetchErr) throw fetchErr
        if (!sessionFetch) throw 'Session fetch returned null - not found!'

        // Attempt session cancel:
        const result = await dbManager.sessions.cancel(guildId, sessionId, actingUserId, validReqBody.data?.reason ?? null)

        // Return results:
        if (result.success) {
            return new reply(res).success({ message: 'Successfully canceled session!' })
        } else {
            return new reply(res).failure('Failed to cancel session! - Unknown')
        }
    } catch (error) {
        // Log & Return Failure:
        createdLog.for('Api').error('INTERNAL ERROR - Cancel Session Endpoint ERR - See Details..', { error })
        return new reply(res).failure('Failed to cancel session! - Internal Error - Unknown')
    }
})



export default sessionRouter