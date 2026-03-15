import { verifyGuildMember } from 'apps/backend/src/server/middleware/guildMembership'
import verifyToken from 'apps/backend/src/server/middleware/verifyToken'
import { useLogger } from 'apps/backend/src/utils/logs/logtail'
import express from 'express'
import { APIResponse as Reply } from '../utils/responseClass'
import { API_SessionTemplateBodyInterface, API_SessionTemplateBodySchema } from '@sessionsbot/shared'
import { supabase } from 'apps/backend/src/utils/database/supabase'
import { HttpStatusCode } from 'axios'
import z, { treeifyError } from 'zod'

const migratingRouter = express.Router({ mergeParams: true })
const createdLog = useLogger();

// POST - Update/Confirm Migrating Templates/Schedules:
// URL: https://api.sessionsbot.fyi/guilds/:guildId/migrating/schedules
migratingRouter.post('/schedules', verifyToken, verifyGuildMember(true), async (req, res) => {
    const guildId = String(req?.params?.guildId)
    const userId = req?.auth?.profile?.discord_id
    try {
        const bodyData: API_SessionTemplateBodyInterface[] = req?.body
        const bodyIds = bodyData?.map(t => t?.id);

        // Confirm Ids Exist as Templates:
        const { data, error } = await supabase.from('migrating_templates').select('*')
            .eq('guild_id', guildId)
            .in('id', bodyIds)
        if (error || !data?.length) {
            // Log & Return Error:
            createdLog.for('Api').error(`FAILED / POST - Fetching migrating templates! -- GuildId: ${guildId}`, { guildId, userId, err: error, body: req?.body })
            return new Reply(res).failure(`FAILED / POST - Fetching migrating templates - Contact Support if this continues...`)
        } if (data?.length != bodyIds?.length) {
            const foundIds = data?.map(d => d?.id)
            return new Reply(res).failure({ message: `1 or more template ids is invalid!`, invalidIds: bodyIds?.filter(id => !foundIds?.includes(id)) }, HttpStatusCode.BadRequest)
        }

        // Validate Each Schedule AS NEW:
        const succeededSchs = new Map<string, API_SessionTemplateBodyInterface>()
        const failedSchs = new Map<string, { value: API_SessionTemplateBodyInterface, input_errors?: any, reason?: any } & { [x: string]: any }>()
        await Promise.all(
            bodyData.map(async (d) => {
                // Validate Migrating Schedule Data:
                const validation = API_SessionTemplateBodySchema.safeParse(d)
                if (!validation?.success) {
                    // Template Data Invalid:
                    failedSchs.set(d?.id, {
                        value: d,
                        input_errors: treeifyError(validation.error)?.properties
                    })
                } else {
                    // Migrating Data Valid -- Save as New Template:
                    const v = validation.data
                    const { error: saveErr } = await supabase.from('session_templates').upsert({
                        ...v
                    })
                    if (saveErr) {
                        // Failed Saving New Template:
                        createdLog.for('Database').error(`Failed to save a migrating template as NEW!`, { guildId, userId, saveErr, t: d })
                        return failedSchs.set(v?.id, {
                            value: v,
                            reason: 'Failed to save to "session_templates"!'
                        })
                    }
                    // Delete "Migrating Template":
                    const { error: deleteERR } = await supabase.from('migrating_templates').delete()
                        .eq('id', v?.id)
                    if (deleteERR) {
                        // Failed Deleting Migrating Template:
                        createdLog.for('Database').error(`Failed to delete a migrating template!`, { guildId, userId, deleteERR, id: d?.id })
                        return failedSchs.set(v?.id, {
                            value: v,
                            reason: 'Failed to delete from "migrating_templates"!'
                        })
                    } else return succeededSchs.set(v?.id, v)
                }
            })
        )

        // Send Result Response:
        const hadFailures = failedSchs?.size > 0
        return new Reply(res).success({
            had_failures: hadFailures,
            succeeded: Object.fromEntries(succeededSchs),
            failed: failedSchs?.size
                ? Object.fromEntries(failedSchs)
                : undefined
        }, hadFailures
            ? HttpStatusCode.MultiStatus
            : HttpStatusCode.Ok
        )

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