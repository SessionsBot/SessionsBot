import express from 'express';
import { verifyGuildMember } from '../../../../middleware/guildMembership';
import verifyToken from '../../../../middleware/verifyToken';
import { useLogger } from '../../../../../utils/logs/logtail';
import { APIResponse as reply } from '../utils/responseClass';
import { API_GuildPreferencesInterface, API_GuildPreferencesSchema, AuditEvent } from '@sessionsbot/shared';
import z from 'zod';
import { HttpStatusCode } from 'axios';
import { supabase } from '../../../../../utils/database/supabase';
import { createAuditLog } from '../../../../../utils/database/auditLog';

const preferencesRouter = express.Router({ mergeParams: true })

const createLog = useLogger();


// PATCH - Update Guild Preferences Endpoint:
// URL: https://api-host.fyi/guilds/:guildId/preferences
preferencesRouter.patch('/', verifyToken, verifyGuildMember(true), async (req, res) => {
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
            // Valid Data - Update Guild Preferences:
            const prefData = validation.data;
            const { data: guildData, error } = await supabase.from('guilds').update(prefData)
                .eq('id', String(guildId))
                .select()
                .single()
            // On Database Error:
            if (error) throw error
            else {
                // Success - Create Audit Log Event:
                createAuditLog({
                    event: AuditEvent.PreferencesUpdated,
                    guild: String(guildId),
                    user: req.auth?.profile?.discord_id,
                    meta: undefined
                })
                // Return Success:
                return new reply(res).success({ message: 'Guild preferences updated!' })
            }
        }

    } catch (err) {
        // Log & Return Failure:
        const guildId = String(req?.params?.guildId)
        createLog.for('Api').error(`FAILED - Updating Guild Preferences - Guild: ${guildId}`, { details: err, guildId })
        return new reply(res).failure('Internal Error - Failed to update server preferences!')
    }
})

export default preferencesRouter;