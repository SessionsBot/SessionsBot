import express from 'express';
import { verifyGuildMember } from '../../../../../middleware/guildMembership';
import verifyToken from '../../../../../middleware/verifyToken';
import { APIResponse as reply } from '../../utils/responseClass';
import { API_SessionTemplateBodySchema, AuditEvent } from '@sessionsbot/shared';
import { useLogger } from '../../../../../../utils/logs/logtail';
import * as z from 'zod';
import { HttpStatusCode } from 'axios';
import { supabase } from '../../../../../../utils/database/supabase';
import { createAuditLog } from '../../../../../../utils/database/auditLog';

const createLog = useLogger();

// Create Router:
// URL: https://api.sessionsbot.fyi/guilds/:guildId/sessions/templates
const sessionTemplatesRouter = express.Router({ mergeParams: true });


// POST - Create New Template:
// URL: https://api.sessionsbot.fyi/guilds/:guildId/sessions/templates/
sessionTemplatesRouter.post(`/`, verifyToken, verifyGuildMember(true), async (req, res) => {
    try {
        // Parse/Read/Validate Request:
        const { data: bodyData } = req?.body;
        const result = API_SessionTemplateBodySchema.safeParse(bodyData)
        if (!result.success) {
            // Return Failure:
            const { properties: invalidFields } = z.treeifyError(result.error)
            return new reply(res).failure({ reason: "Invalid Inputs!", invalidFields }, HttpStatusCode.BadRequest);
        } else {
            // Valid - Save/Create Session Template:
            const sessionData = result.data;

            const { data: newSession, error: saveError } = await supabase.from('session_templates').insert(sessionData).select('*').single()
            if (saveError || !newSession) {
                // Return Failure:
                createLog.for('Api').error('Failed to Save - New Session Template', { data: sessionData, saveError, guildId: sessionData?.guild_id, userId: req?.auth?.profile?.id });
                return new reply(res).failure({ reason: "Failed to Save - New Session Template", details: saveError }, HttpStatusCode.BadRequest);
            } else {
                // Succeeded - Return Success:
                createAuditLog({
                    event: AuditEvent.ScheduleCreated,
                    guild: newSession.guild_id,
                    user: req?.auth?.profile?.discord_id,
                    meta: {
                        template_id: newSession.id
                    }
                })
                return new reply(res).success({ message: "Successfully created session template!", session: newSession })
            }
        }

    } catch (err) {
        // Log & Return Err:
        const guildId = String(req.params?.guildId)
        const userId = req?.auth?.profile?.id
        const errTxt = `Failed to create/save a new session template!`;
        createLog.for('Api').error(errTxt, { err, body: req.body, guildId, userId });
        return new reply(res).failure(errTxt);
    }
})


// PATCH - Edit Existing Template:
// URL: https://api.sessionsbot.fyi/guilds/:guildId/sessions/templates/
sessionTemplatesRouter.patch(`/`, verifyToken, verifyGuildMember(true), async (req, res) => {
    try {
        // Parse/Read/Validate Request:
        const { data: bodyData } = req.body;
        const result = API_SessionTemplateBodySchema.safeParse(bodyData)
        if (!result.success) {
            // Return Failure:
            const { properties: invalidFields } = z.treeifyError(result.error)
            return new reply(res).failure({ reason: "Invalid Inputs!", invalidFields }, HttpStatusCode.BadRequest);
        } else {
            // Valid - Find/Edit Session Template:
            const sessionData = result.data;

            const { data: ExtSession, error: saveError } = await supabase.from('session_templates')
                .update({ ...sessionData, failure_count: 0, enabled: true }) // reset fails on update
                .eq("id", sessionData.id)
                .select().limit(1).single()

            if (saveError || !ExtSession) {
                // Return Failure:
                createLog.for('Api').error('Failed to Edit - Existing Session Template', { data: sessionData, saveError, guildId: sessionData?.guild_id, userId: req?.auth?.profile?.id });
                return new reply(res).failure({ reason: "Failed to Edit - Existing Session Template", details: saveError }, HttpStatusCode.BadRequest);
            } else {
                // Succeeded - Return Success:
                createAuditLog({
                    event: AuditEvent.ScheduleEdited,
                    guild: ExtSession.guild_id,
                    user: req?.auth?.profile?.discord_id,
                    meta: {
                        template_id: ExtSession.id
                    }
                })
                return new reply(res).success({ message: "Successfully edited session template!", session: ExtSession })
            }
        }

    } catch (err) {
        // Log & Return Err:
        const guildId = String(req.params?.guildId)
        const userId = req?.auth?.profile?.id
        const templateId = String(req?.params?.templateId)
        const errTxt = `Failed to edit existing session template!`;
        createLog.for('Api').error(errTxt, { err, body: req?.body, templateId, userId, guildId });
        return new reply(res).failure(errTxt);
    }
})


// DELETE - Delete Existing Template:
// URL: https://api.sessionsbot.fyi/guilds/:guildId/sessions/templates/:templateId
sessionTemplatesRouter.delete(`/:templateId`, verifyToken, verifyGuildMember(true), async (req, res) => {
    try {
        // Parse/Read/Validate Request:
        const { templateId } = req.params;

        // Attempt to Delete Session Template by Id:
        const { data, error } = await supabase.from('session_templates').delete()
            .eq('id', String(templateId))
            .select()
            .single()

        // If deletion error:
        if (error) {
            throw { details: 'Failed to delete template by id within database.', error }
        }

        // Return Success:
        createAuditLog({
            event: AuditEvent.ScheduleDeleted,
            guild: data.guild_id,
            user: req?.auth?.profile?.discord_id,
            meta: {
                template_id: data.id
            }
        })
        return new reply(res).success(data)


    } catch (err) {
        // Log & Return Err:
        const guildId = String(req.params?.guildId)
        const userId = req?.auth?.profile?.id
        const templateId = String(req?.params?.templateId)
        const errTxt = `Failed to delete existing session template!`;
        createLog.for('Api').error(errTxt, { err, templateId, guildId, userId });
        return new reply(res).failure(errTxt);
    }
})


// Exported Router:
export default sessionTemplatesRouter;