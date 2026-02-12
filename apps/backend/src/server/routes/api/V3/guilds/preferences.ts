import express from 'express';
import { verifyGuildAdmin } from '../../../../middleware/guildMembership';
import verifyToken, { authorizedRequest } from '../../../../middleware/verifyToken';
import { useLogger } from '../../../../../utils/logs/logtail';
import { API_GuildPreferencesInterface, API_GuildPreferencesSchema, APIResponse as reply } from '@sessionsbot/shared';
import z from 'zod';
import { HttpStatusCode } from 'axios';

const preferencesRouter = express.Router({ mergeParams: true })

const createLog = useLogger();

// PATCH - Update Guild Preferences Endpoint:
// URL: https://api-host.fyi/guilds/:guild_id/preferences
preferencesRouter.patch('/', verifyToken, verifyGuildAdmin, async (req: authorizedRequest, res) => {
    try {
        // Parse Req:
        const { data } = req.body as { data: API_GuildPreferencesInterface }
        const { guildId } = req.params;

        // Validate Data:
        const validation = z.safeParse(API_GuildPreferencesSchema, data)

        if (!validation.success) {
            // Invalid Inputs - Return Error:
            const input_errors = z.treeifyError(validation.error);
            return new reply(res).failure('Invalid Inputs - Please confirm and try again..', HttpStatusCode.BadRequest, { input_errors, data })
        } else {
            // Valid Data:
            const data = validation.data
            // ! Update Guild in Database - FINISH ME!
        }

    } catch (err) {
        // Log & Return Failure:
        createLog.for('Api').error('FAILED - Updating Guild Preferences - See Details..', { details: err })
        return new reply(res).failure('Internal Error - Failed to update server preferences!')
    }
})

export default preferencesRouter;