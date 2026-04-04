import { verifyGuildMember } from '../../../../middleware/guildMembership'
import verifyToken from '../../../../middleware/verifyToken'
import { useLogger } from '../../../../../utils/logs/logtail'
import express from 'express'
import { APIResponse as Reply } from '../utils/responseClass'
import { API_SessionTemplateBodyInterface, API_SessionTemplateBodySchema } from '@sessionsbot/shared'
import { supabase } from '../../../../../utils/database/supabase'
import { HttpStatusCode } from 'axios'
import z, { treeifyError } from 'zod'

const migratingRouter = express.Router({ mergeParams: true })
const createdLog = useLogger();

// PATCH - Update/Confirm Migrating Templates/Schedules:
// URL: https://api.sessionsbot.fyi/guilds/:guildId/migrating/schedules
migratingRouter.patch('/schedules', verifyToken, verifyGuildMember(true), async (req, res) => {
    const guildId = String(req?.params?.guildId)
    const userId = req?.auth?.profile?.discord_id
    try {
        const bodyData: API_SessionTemplateBodyInterface = req?.body?.data
        if (!bodyData) return new Reply(res).failure(`Missing body data for confirming migrating session!`, HttpStatusCode.BadRequest)

        // Confirm Id Exists as Migrating Templates:
        const { data, error } = await supabase.from('migrating_templates').select('*')
            .eq('guild_id', guildId)
            .eq('id', bodyData?.id)
            .single()
        if (error || !data) {
            // Log & Return Error:
            createdLog.for('Api').error(`FAILED / POST - Fetching migrating template! -- GuildId: ${guildId}`, { guildId, userId, err: error, body: req?.body })
            return new Reply(res).failure(`FAILED / POST - Fetching migrating template - Contact Support if this continues...`)
        }

        // Validate Migrating Schedule Data:
        const validation = API_SessionTemplateBodySchema.safeParse(bodyData)
        if (!validation?.success) {
            // Template Data Invalid:
            return new Reply(res).failure({ message: `Invalid Fields - Bad Request: Verify Session/Schedule data input fields and try again!`, errors: treeifyError(validation.error)?.properties }, HttpStatusCode.BadRequest)
        } else {
            // Migrating Data Valid -- Save as New Template:
            const v = validation.data
            const { error: saveErr } = await supabase.from('session_templates').upsert({
                ...v
            })
            if (saveErr) {
                // Failed Saving New Template:
                createdLog.for('Database').error(`Failed to save a migrating template as NEW!`, { guildId, userId, saveErr, data: v })
                return new Reply(res).failure({ message: `Internal Error: Failed to save new schedule to database!` })
            }
            // Delete "Migrating Template":
            const { error: deleteErr } = await supabase.from('migrating_templates').delete()
                .eq('id', v?.id)
            if (deleteErr) {
                // Failed Deleting Migrating Template:
                createdLog.for('Database').error(`Failed to delete a migrating template!`, { guildId, userId, deleteErr, deletionId: v?.id })
                return new Reply(res).failure({ message: `Internal Error: Failed to delete old migrating schedule from database!` })
            }

            // Return Success:
            return new Reply(res).success(`Saved new schedule from migrating template! - Id: ${validation?.data?.id}`)
        }

    } catch (err) {
        // Log & Return Error:
        createdLog.for('Api').error(`FAILED - POST to migrating templates! -- GuildId: ${guildId}`, { guildId, userId, err, body: req?.body })
        return new Reply(res).failure(`Failed to update migrating templates - Internal Error - Contact Support if this continues...`)
    }
})


// DELETE - Delete/Remove Migrating Templates/Schedules:
// URL: https://api.sessionsbot.fyi/guilds/:guildId/migrating/schedules
migratingRouter.delete('/schedules', verifyToken, verifyGuildMember(true), async (req, res) => {
    const guildId = String(req?.params?.guildId)
    const userId = req?.auth?.profile?.discord_id
    try {
        const bodyIds: string[] = req?.body
        const succeededIds = new Set<string>()
        const failedIds = new Map<string, { reason?: any } & { [x: string]: any }>()

        // Validate Body:
        if (!Array.isArray(bodyIds)) return new Reply(res).failure('Invalid Body Type - Please provide an array of template ids to delete...', HttpStatusCode.BadRequest)
        const validation = z.array(z.uuid()).min(1).safeParse(bodyIds);
        if (!validation.success) {
            const errs = z.treeifyError(validation.error)
            return new Reply(res).failure({ message: `Invalid Request Body - See Details - Confirm & Try Again...`, errors: errs }, HttpStatusCode.BadRequest)
        }

        // Delete Requested Ids - SYNCHRONOUSLY:
        await Promise.all(bodyIds.map(async (id) => {
            const { error, count } = await supabase.from('migrating_templates').delete({ count: 'exact' })
                .eq('guild_id', guildId)
                .eq('id', id)
            if (error || !count) {
                // Failed to Delete - Add to Map:
                failedIds.set(id, {
                    reason: 'Failed to delete from database! If this persists, please contact bot support!'
                })
            } else succeededIds.add(id)
        }))

        // Send Result Response:
        const hadFailures = failedIds?.size > 0
        return new Reply(res).success({
            had_failures: hadFailures,
            succeeded: Array.from(succeededIds?.values()),
            failed: failedIds?.size
                ? Object.fromEntries(failedIds)
                : undefined
        }, hadFailures
            ? HttpStatusCode.MultiStatus
            : HttpStatusCode.Ok
        )

    } catch (err) {
        // Log & Return Error:
        createdLog.for('Api').error(`FAILED - DELETING from migrating templates! -- GuildId: ${guildId}`, { guildId, userId, err, body: req?.body })
        return new Reply(res).failure(`Failed to delete migrating templates - Internal Error - Contact Support if this continues...`)
    }
})


export default migratingRouter