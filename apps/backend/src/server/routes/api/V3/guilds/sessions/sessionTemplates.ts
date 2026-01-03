import express from 'express';
import { verifyGuildAdmin } from '../../../../../middleware/guildMembership';
import verifyToken, { authorizedRequest } from '../../../../../middleware/verifyToken';
import { API_SessionTemplateBodySchema, Database, APIResponse as reply } from '@sessionsbot/shared';
import logtail, { useLogger } from '../../../../../../utils/logs/logtail';
import * as z from 'zod';
import { HttpStatusCode } from 'axios';
import { supabase } from '../../../../../../utils/database/supabase';

const createLog = useLogger();

// Create Router:
// path: `https://ApiRoot.any/api/guilds/:guildId/sessions/templates`;
const sessionTemplatesRouter = express.Router({ mergeParams: true });


// POST - Create New Template:
sessionTemplatesRouter.post(`/`, verifyToken, verifyGuildAdmin, async (req: authorizedRequest, res) => {
    try {
        // Parse/Read/Validate Request:
        const { data: bodyData } = req.body;
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
                createLog.for('Api').warn('Failed to Save - New Session Template', { data: sessionData, saveError });
                return new reply(res).failure({ reason: "Failed to Save - New Session Template", details: saveError }, HttpStatusCode.BadRequest);
            } else {
                // Succeeded - Return Success:
                return new reply(res).success({ message: "Successfully created session template!", session: newSession })
            }
        }

    } catch (err) {
        // Log & Return Err:
        const errTxt = `Failed to create a new session template!`;
        createLog.for('Api').warn(errTxt, { err, body: req.body, from: 'Caught Error!' });
        return new reply(res).failure(errTxt);
    }
})


// PATCH - Edit Existing Template:
sessionTemplatesRouter.patch(`/`, verifyToken, verifyGuildAdmin, async (req: authorizedRequest, res) => {
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
                .update(sessionData)
                .eq("id", sessionData.id)
                .select().limit(1).single()

            if (saveError || !ExtSession) {
                // Return Failure:
                createLog.for('Api').warn('Failed to Edit - Existing Session Template', { data: sessionData, saveError });
                return new reply(res).failure({ reason: "Failed to Edit - Existing Session Template", details: saveError }, HttpStatusCode.BadRequest);
            } else {
                // Succeeded - Return Success:
                return new reply(res).success({ message: "Successfully edited session template!", session: ExtSession })
            }
        }

    } catch (err) {
        // Log & Return Err:
        const errTxt = `Failed to edit existing session template!`;
        createLog.for('Api').warn(errTxt, { err, body: req.body, from: 'Caught Error!' });
        return new reply(res).failure(errTxt);
    }
})




// Exported Router:
export default sessionTemplatesRouter;