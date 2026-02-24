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
    /** An (active) session has been marked as canceled. */
    SessionCanceled = "Session Canceled",
    /** User has been added as an RSVP to a session slot. */
    RsvpCreated = "RSVP Created",
    /** User has been removed as an RSVP from a session slot. */
    RsvpDeleted = "RSVP Deleted",
    /** Guild wide preferences has been updated. */
    PreferencesUpdated = "Preferences Updated",
}

/** Individualized Meta Data for Audit Event's by Event Type */
const EventMetaData = {
    [AuditEvent.BotAdded]: undefined,
    [AuditEvent.SessionCreated]: {
        username: '' as string,
        template_id: '' as string
    },
    [AuditEvent.SessionEdited]: {
        username: '' as string,
        template_id: '' as string
    },
    [AuditEvent.SessionDeleted]: {
        username: '' as string,
        template_id: '' as string
    },
    [AuditEvent.SessionPosted]: {
        session_id: '' as string
    },
    [AuditEvent.SessionCanceled]: {
        session_id: '' as string,
        reason: '' as string | undefined
    },
    [AuditEvent.RsvpCreated]: {
        session_id: '' as string,
        rsvp_id: '' as string
    },
    [AuditEvent.RsvpDeleted]: {
        session_id: '' as string,
        rsvp_id: '' as string
    },
    [AuditEvent.PreferencesUpdated]: {
        username: '' as string
    },
} as const

/** Returns the Meta Data *Type* for a specific **{@link AuditEvent}**. */
export type AuditMetaData<E extends AuditEvent> =
    typeof EventMetaData[E] extends null
    ? undefined
    : typeof EventMetaData[E]
