
import { API_DataDeletionRequestBodySchema, discordSnowflakeSchema } from '@sessionsbot/shared';
import { useLogger } from '../../../../../utils/logs/logtail';
import express from 'express';
import { APIResponse as reply } from '../utils/responseClass';
import { HttpStatusCode } from 'axios';
import z from 'zod';
import { supabase } from '../../../../../utils/database/supabase';
import verifyToken from '../../../../middleware/verifyToken';
import sendDiscordLog from '../../../../../utils/logs/discord';


const dataDeletionRouter = express.Router({ mergeParams: true })

const createLog = useLogger();

dataDeletionRouter.post('/request', verifyToken, async (req, res) => {
    try {
        // Validate Req Body:
        const validatedBody = API_DataDeletionRequestBodySchema.safeParse(req?.body);
        if (validatedBody.success) {

            const userId = req?.auth?.profile?.discord_id

            const { data: existing } = await supabase
                .from('deletion_requests')
                .select('id')
                .eq('user_id', userId)
                .in('status', ['pending', 'processing'])
                .maybeSingle()

            if (existing) {
                return new reply(res).failure(
                    { message: 'A deletion request is already in progress.' },
                    HttpStatusCode.Conflict
                )
            }

            // Save Request to Database:
            const { data, error } = await supabase.from('deletion_requests').insert({
                user_id: userId,
                status: 'pending',
                delete_guild: validatedBody.data.deleteGuildData,
                delete_user: validatedBody.data.deleteUserData,
                guild_ids: validatedBody.data?.guildIds ?? null
            }).select('id')
                .maybeSingle()

            if (error) throw error

            // Send Discord Internal Alert:
            sendDiscordLog.events.deletionRequestCreated(data?.id, validatedBody.data.deleteUserData, validatedBody.data.deleteGuildData)

            // Send Successful Response:
            return new reply(res).success({
                message: 'Request Received!',
                values: validatedBody.data,
                request_id: data?.id
            })

        } else {
            // INVALID - Req Body - Return Error(s)
            const input_errors = z.treeifyError(validatedBody.error)?.properties
            return new reply(res).failure({
                message: 'Invalid request body! - See input_errors',
                input_errors,
                body: req?.body
            }, HttpStatusCode.BadRequest)
        }


    } catch (err) {
        // Log & Return Error:
        createLog.for('Api').error('Failed to process data deletion request - See Details!', { userId: req?.auth?.profile?.discord_id, err })
        return new reply(res).failure(
            { message: 'Failed to process request.' },
            HttpStatusCode.InternalServerError
        )
    }
})

export default dataDeletionRouter