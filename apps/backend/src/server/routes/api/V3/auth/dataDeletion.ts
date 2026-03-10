
import { API_DataDeletionRequestBodySchema, discordSnowflakeSchema } from '@sessionsbot/shared';
import verifyToken from 'apps/backend/src/server/middleware/verifyToken';
import { useLogger } from 'apps/backend/src/utils/logs/logtail';
import express from 'express';
import { APIResponse as reply } from '../utils/responseClass';
import { HttpStatusCode } from 'axios';
import z from 'zod';

const dataDeletionRouter = express.Router({ mergeParams: true })

const createLog = useLogger();

dataDeletionRouter.post('/request', verifyToken, async (req, res) => {
    try {
        // Validate Req Body:
        const validatedBody = API_DataDeletionRequestBodySchema.safeParse(req?.body);
        if (validatedBody.success) {

            // Save Request to Database:
            // const { } = await supabase.from('deletion_requests')

            // Valid Req Body - Save Request to Database:
            return new reply(res).success({
                message: 'Request Received!',
                values: validatedBody.data
            })

        } else {
            // INVALID - Req Body - Return Error(s)
            const input_errors = z.treeifyError(validatedBody.error).properties
            return new reply(res).failure({
                message: 'Invalid request body! - See input_errors',
                input_errors,
                values: validatedBody.data
            }, HttpStatusCode.BadRequest)
        }


    } catch (err) {
        // Log & Return Error:
        createLog.for('Api').error('Failed to process data deletion request - See Details!', { userId: req?.auth?.profile?.discord_id, err })
    }
})

export default dataDeletionRouter