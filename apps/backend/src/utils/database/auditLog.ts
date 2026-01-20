import { Result } from "@sessionsbot/shared"
import { supabase } from "./supabase"

export enum AuditEvent {
    /** Sessions Bot is added to a new guild. */
    BotAdded = "Bot Added",
    /** New Session (template) has been created. */
    SessionCreated = "Session Created",
    /** Session (template) has been edited. */
    SessionEdited = "Session Edited",
    /** Session (template) has been deleted. */
    SessionDeleted = "Session Deleted",
    /** Session has been posted (from template/schedule). */
    SessionPosted = "Session Posted",
    /** User has been added as an RSVP to a session slot. */
    RsvpCreated = "RSVP Created",
    /** User has been removed as an RSVP from a session slot. */
    RsvpDeleted = "RSVP Deleted",
}


/** Creates and stores a new `Audit Log` event for the specified details. */
async function createAuditLog(opts: {
    /** The type of audit log event that has occurred. */
    event: AuditEvent
    /** The `guildId` of the server to store an audit event for. */
    guild: string
    /** The `userId` related to the occurred action (if any).
     * @_default `"BOT"` */
    user?: string | undefined
}) {
    // Defaults:
    if (!opts.user) opts.user = "BOT";

    // Save:
    const save = await supabase.from('audit_logs').insert({
        guild_id: opts.guild,
        user_id: opts.user,
        event_type: opts.event.toString()
    })

    if (save.error) {
        return Result.err(save.error, 'Failed - Error saving audit log event to database!')
    } else {
        return Result.ok('Audit Event - Created')
    }
}


export default createAuditLog;





