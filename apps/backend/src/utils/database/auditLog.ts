import { supabase } from "./supabase"
import { useLogger } from "../logs/logtail"

// Services:
const createdLog = useLogger();

/** The type of audit log event that has occurred. */
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
    /** A preference has been updated. */
    PreferenceUpdated = "Preference Updated",
}

/** Individualized Meta Data for Audit Event's by Event Type */
const EventMetaData = {
    [AuditEvent.BotAdded]: null as undefined,
    [AuditEvent.SessionCreated]: {
        template_id: '' as string
    },
    [AuditEvent.SessionEdited]: {
        template_id: '' as string
    },
    [AuditEvent.SessionDeleted]: {
        template_id: '' as string
    },
    [AuditEvent.SessionPosted]: {
        session_id: '' as string
    },
    [AuditEvent.RsvpCreated]: {
        session_id: '' as string,
        rsvp_id: '' as string
    },
    [AuditEvent.RsvpDeleted]: {
        session_id: '' as string,
        rsvp_id: '' as string
    },
    [AuditEvent.PreferenceUpdated]: {
        preference_name: '' as string
    },
} as const

/** Returns the Meta Data *Type* for a specific **{@link AuditEvent}**. */
export type AuditMetaData<E extends AuditEvent> =
    typeof EventMetaData[E] extends null
    ? undefined
    : typeof EventMetaData[E]



/** Creates and stores a new `Audit Log` event for the specified details. */
async function createAuditLog<E extends AuditEvent>(opts: {
    /** The type of audit log event that has occurred. */
    event: E,
    /** The related meta data for the audit event that has occurred. */
    meta: AuditMetaData<E>
    /** The `guildId` of the server to store an audit event for. */
    guild: string
    /** The **DISCORD** `userId` related to the occurred action (if any).
     * @_default `"BOT"` */
    user?: string | undefined,
}) {
    // Defaults:
    if (!opts.user) opts.user = "BOT";

    // Event Meta:
    const eventMetaString = opts?.['meta']
        ? (JSON.stringify(opts?.['meta']) || null)
        : null

    // Save:
    const save = await supabase.from('audit_logs').insert({
        guild_id: opts.guild,
        user_id: opts.user,
        event_type: opts.event.toString(),
        event_meta: eventMetaString
    })


    if (save.error) {
        // Log & Return Failure:
        createdLog.for('Database').error(`Failed to save an Audit Event! - ${opts.guild}`, { options: opts, error: save.error })
        return { success: false, error: save.error } as const
    } else {
        // Return Success:
        return { success: true, data: `Audit Event for "${opts.event.toString()}" has been created!` } as const
    }
}


export default createAuditLog;
