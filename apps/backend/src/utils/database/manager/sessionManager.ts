import { DateTime } from "luxon";
import { supabase } from "../supabase";
import { dbResult } from "./dbManager";
import { success } from "zod";
import { useLogger } from "../../logs/logtail";
import { updateExistingSessionPanel } from "../../bot/messages/sessionPanels";
import { getGuildSubscriptionFromId } from "../../bot/entitlements";
import { createAuditLog } from "../auditLog";
import { AuditEvent, FullSessionData } from "@sessionsbot/shared";

const createLog = useLogger();

// Error Types:
type SessionErrorType = 'AlreadyStarted' | 'Unknown'
class SessionError<d> {
    public success: false
    public error: SessionErrorType
    public sessionData: undefined
    public details: d | undefined

    constructor(t: SessionErrorType, d?: d) {
        this.success = false
        this.error = t
        this.details = d
    }
}
class SessionSuccess<d> {
    public success: true
    public error: null
    public sessionData: FullSessionData
    public details: d | undefined

    constructor(session: FullSessionData, d?: d) {
        this.success = true
        this.error = null
        this.sessionData = session
        this.details = d
    }
}


export const sessionManager = {

    /** Cancels a session (that hasn't a;ready started) w/ optional reason. */
    async cancel(guildId: string, sessionId: string, actingId: string, reason?: string | undefined) {
        try {
            // Fetch Guild/Session & Guild Subscription:
            const [{ data, error }, subscription] = await Promise.all([
                supabase.from('guilds')
                    .select('*, sessions(*, session_rsvp_slots(*, session_rsvps(*)))')
                    .eq('id', guildId)
                    .single(),
                getGuildSubscriptionFromId(guildId)
            ])
            const session = data.sessions.find(s => s.id == sessionId)
            if (error) throw error;
            if (!data) throw 'Guild Data returned as null - NOT FOUND';
            if (!session) throw 'Session Data returned as null - NOT FOUND';

            // Confirm Session has not yet started:
            const startUTC = DateTime.fromISO(session.starts_at_utc, { zone: 'utc' })
            if (startUTC < DateTime.utc()) {
                // Already Started - Not Allowed:
                return new SessionError(
                    "AlreadyStarted",
                    { message: `Unfortunately, this session has already started! Therefore you cannot delay it's start date.` }
                )
            }

            // Cancel Session:
            const { error: updateErr } = await supabase.from('sessions').update({
                status: 'canceled'
            }).eq('id', sessionId)
            if (updateErr) throw updateErr;

            // Update Signup Panel:
            const updatedSession = {
                ...session,
                status: 'canceled' as const
            }
            const updatePanel = await updateExistingSessionPanel(updatedSession, subscription.limits.SHOW_WATERMARK, data?.accent_color, data?.calendar_button)
            if (updatePanel.success) createLog.for('Bot').warn('Failed to update a session panel after canceling! - See Details...', { updatePanel, guildId, sessionId })

            // Create Audit Log:
            createAuditLog({
                event: AuditEvent.SessionCanceled,
                guild: guildId,
                user: actingId,
                meta: {
                    reason: reason ?? null,
                    session_id: sessionId
                }
            })

            // Return Success:
            return new SessionSuccess(session)

        } catch (err) {
            // Log & Return Failure:
            createLog.for('Database').error('Failed to Cancel Session - See Details...', { guildId, sessionId, reason, error: err })
            return new SessionError(
                "Unknown",
                { message: `Hm, it seems an error occurred behind the scenes while trying to perform this action. Keeps happening? Get in touch with Bot Support!` }
            )
        }
    },

    /** Delays a session start to a specified date(*trusted*) w/ optional reason. */
    async delay(guildId: string, sessionId: string, newDateUTC: DateTime, actingId: string, reason?: string | undefined) {
        try {
            // Delay Session:
            const newStartISO = newDateUTC?.toISO()
            if (!newStartISO) throw 'Invalid delay time provided!'
            const [
                { data: sessionData, error: updateErr },
                { data: guildData, error: guildDataErr },
                subscription
            ] = await Promise.all([
                supabase.from('sessions').update({
                    starts_at_utc: newStartISO,
                    status: 'delayed'
                })
                    .eq('id', sessionId)
                    .select('*, session_rsvp_slots(*, session_rsvps(*))')
                    .single(),
                supabase.from('guilds')
                    .select('accent_color, calendar_button')
                    .eq('id', guildId)
                    .single(),
                getGuildSubscriptionFromId(guildId)
            ])
            if (updateErr) throw updateErr;
            if (guildDataErr) throw guildDataErr;
            if (!sessionData || !guildData) throw 'Missing updated guild/session data after session delay!'

            // Update Signup Panel:
            const updatePanel = await updateExistingSessionPanel(sessionData, subscription.limits.SHOW_WATERMARK, guildData?.accent_color, guildData?.calendar_button)
            if (updatePanel.success) createLog.for('Bot').warn('Failed to update a session panel after canceling! - See Details...', { updatePanel, guildId, sessionId })

            // Create Audit Log:
            createAuditLog({
                event: AuditEvent.SessionCanceled,
                guild: guildId,
                user: actingId,
                meta: {
                    reason: reason ?? null,
                    session_id: sessionId
                }
            })

            // Return Success:
            return new SessionSuccess(sessionData)
        } catch (err) {
            // Log & Return Failure:
            createLog.for('Database').error('Failed to Delay Session - See Details...', { guildId, sessionId, newDateUTC: newDateUTC?.toISO(), reason, error: err })
            return new SessionError(
                "Unknown",
                { message: `Hm, it seems an error occurred behind the scenes while trying to perform this action. Keeps happening? Get in touch with Bot Support!` }
            )
        }
    }

}