import express from 'express';
import { verifyGuildMember } from '../../../../middleware/guildMembership';
import verifyToken, { authorizedRequest } from '../../../../middleware/verifyToken';
import { useLogger } from '../../../../../utils/logs/logtail';
import { API_GuildPreferencesInterface, API_GuildPreferencesSchema, AuditEvent, APIResponse as reply } from '@sessionsbot/shared';
import z from 'zod';
import { HttpStatusCode } from 'axios';
import { supabase } from '../../../../../utils/database/supabase';
import { createAuditLog } from '../../../../../utils/database/auditLog';

const preferencesRouter = express.Router({ mergeParams: true })

const createLog = useLogger();

// GET - Read Guild Preferences:
// URL - https://api.sessionsbot.fyi/guilds/:guildId/preferences
preferencesRouter.get(`/`, verifyToken, verifyGuildMember(true), async (req: authorizedRequest, res) => {
    try {
        // Parse Req:
        const { guildId } = req.params;

        // Read Preferences:
        const { data, error } = await supabase.from('guilds')
            .select('*')
            .eq('id', guildId?.toString())
            .maybeSingle()

        if (error) {
            createLog.for('Database').error('Failed to read guild preferences! - See details..', { error, guildId })
        }
        if (!data) {
            return new reply(res).failure(`Failed to find guild data from guild id! (${guildId})`, HttpStatusCode.NotFound)
        }

        return new reply(res).success(data)

    } catch (err) {
        console.warn('API ERR', err)
        return new reply(res).failure(`Failed to find guild data preferences from guild id! - Internal Error!`, HttpStatusCode.InternalServerError)
    }
})


// PATCH - Update Guild Preferences Endpoint:
// URL: https://api-host.fyi/guilds/:guildId/preferences
preferencesRouter.patch('/', verifyToken, verifyGuildMember(true), async (req: authorizedRequest, res) => {
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
                    meta: {
                        username: req?.auth?.profile?.username
                    }
                })
                // Return Success:
                return new reply(res).success({ message: 'Guild preferences updated!' })
            }
        }

    } catch (err) {
        // Log & Return Failure:
        createLog.for('Api').error('FAILED - Updating Guild Preferences - See Details..', { details: err })
        return new reply(res).failure('Internal Error - Failed to update server preferences!')
    }
})

export default preferencesRouter;