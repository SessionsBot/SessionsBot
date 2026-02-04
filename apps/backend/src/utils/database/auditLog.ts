import { supabase } from "./supabase"
import { useLogger } from "../logs/logtail"
import { AuditEvent, AuditMetaData } from "@sessionsbot/shared";

// Services:
const createdLog = useLogger();


/** Creates and stores a new `Audit Log` event for the specified details. */
export async function createAuditLog<E extends AuditEvent>(opts: {
    /** The type of audit log event that has occurred. */
    event: E,
    /** The related meta data for the audit event that has occurred. */
    meta: AuditMetaData<E>
    /** The `guildId` of the server to store an audit event for. */
    guild: string
    /** The **DISCORD** `userId` related to the occurred action */
    user: string,
}) {

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
