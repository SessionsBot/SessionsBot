import { DateTime } from "luxon";
import { useLogger } from "../../logs/logtail";
import { supabase } from "../supabase"
import { getGuildSubscriptionFromId } from "../../bot/entitlements";
import core from "../../core/core";
import { AuditEvent, FullSessionData } from "@sessionsbot/shared";
import { updateExistingSessionPanel } from "../../bot/messages/sessionPanels";
import { createAuditLog } from "../auditLog";
import { increaseGuildStat } from "./statsManager";

// Logger Util:
const createLog = useLogger();


// Response Types & Classes:
type RsvpAddFailure = 'Past Session' | 'Session Canceled' | 'Already RSVPed' | 'Required Roles' | 'At Capacity' | 'Internal' | 'Unknown';
class rsvpAddResult {
    static success(sessionData: FullSessionData) {
        return {
            success: true,
            data: 'Succeeded!',
            sessionData: sessionData,
            error: <undefined>null,
        }
    }
    static fail<e>(type: RsvpAddFailure, sessionData: FullSessionData, data?: e) {
        return {
            success: false,
            data: <undefined>null,
            sessionData,
            error: {
                type,
                details: <e | undefined>data,
            },

        }
    }
}

type RsvpRemoveFailure = "Not RSVPed" | "Internal" | "Unknown"
class RsvpRemoveResult {
    static success(sessionData: FullSessionData) {
        return {
            success: true,
            sessionData,
            error: <null>undefined
        }
    }
    static fail<e>(type: RsvpRemoveFailure, sessionData: FullSessionData, data?: e) {
        return {
            success: false,
            sessionData,
            error: {
                type,
                details: <e | undefined>data,
            }
        }
    }
}


// Default Methods:
export default {

    /** Used to attempt to assign specified user to specified rsvp slot - returns strictly typed errors. */
    async add(guildId: string, sessionId: string, rsvpId: string, userId: string) {
        try {
            // Fetch Guild / Session Data:
            const [guild, guildData, guildSubscription] = await Promise.all([
                core.botClient.guilds.fetch(guildId),
                supabase.from('guilds')
                    .select('accent_color, calendar_button, sessions(*, session_rsvp_slots(*, session_rsvps(*)))')
                    .eq('id', guildId)
                    .eq('sessions.id', sessionId)
                    .single(),
                getGuildSubscriptionFromId(guildId)
            ])
            // Confirm Fetched Data:
            if (!guild) return rsvpAddResult.fail('Internal', undefined, { message: 'Failed to fetch guild for rsvp!', guildId })
            if (!guildData.data || guildData.error) return rsvpAddResult.fail('Internal', undefined, { message: 'Database error!', guildData })
            if (!guildSubscription) return rsvpAddResult.fail('Internal', undefined, { message: 'Failed to load guild subscription for rsvp!', guildData, guildId })
            const sessionData = guildData.data.sessions[0]
            const rsvpSlotData = sessionData?.session_rsvp_slots.find(s => s.id == rsvpId)
            if (!rsvpSlotData) return rsvpAddResult.fail('Internal', undefined, { message: 'Failed to load rsvp slot for rsvp!', guildData, guildId, rsvpId, userId })


            // Check if session is CANCELED or PAST START DATE:
            const sessionStartUtc = DateTime.fromISO(sessionData.starts_at_utc)
            const isCanceled = sessionData.status == 'canceled'
            if (sessionStartUtc <= DateTime.utc()) {
                // Session in Past - Not Allowed:
                return rsvpAddResult.fail("Past Session", sessionData)
            }
            if (isCanceled) {
                // Session CANCELED - Not Allowed:
                return rsvpAddResult.fail("Session Canceled", sessionData)
            }

            // Check if user is ALREADY RSVPed within this session:
            const alreadyInSession = sessionData.session_rsvp_slots.some(s => s.session_rsvps?.some(r => r.user_id == userId))
            if (alreadyInSession) {
                // ALREADY RSVPed within this Session - Not Allowed:
                return rsvpAddResult.fail("Already RSVPed", sessionData)
            }

            // Check REQUIRED ROLES for this RSVP Slot:
            if (guildSubscription.limits.ALLOW_RSVP_ROLE_RESTRICTION && rsvpSlotData.roles_required?.length) {
                const requiredRoleIds = rsvpSlotData.roles_required;
                const userMember = guild.members.cache.get(userId)
                    ?? await guild.members.fetch(userId)
                // Confirm user has 1 OR MORE REQUIRED ROLES:
                const userAllowed = userMember.roles.cache.some(r => requiredRoleIds.includes(r?.id))
                if (!userAllowed) return rsvpAddResult.fail("Required Roles", sessionData)
            }

            // Check Rsvp Slot Capacity:
            if (rsvpSlotData.session_rsvps?.length >= rsvpSlotData.capacity) {
                // Rsvp Slot AT CAPACITY - Not Allowed:
                return rsvpAddResult.fail('At Capacity', sessionData)
            }

            // CHECKS PASSED - Assign User to RSVP Slot:
            const { error: newRsvpError } = await supabase.from('session_rsvps').insert({
                session_id: sessionId,
                rsvp_slot_id: rsvpSlotData.id,
                user_id: userId
            })
            if (newRsvpError) throw { message: 'Failed to save new RSVP after checks cleared...', newRsvpError };

            // Refetch Session:
            const { data: updatedSessionData, error: updatedSessionError } = await supabase.from('sessions')
                .select('*, session_rsvp_slots(*, session_rsvps(*))')
                .eq('id', sessionId)
                .single()
            if (updatedSessionError) throw { message: 'Failed to GET new RSVP data after rsvp assignment...', updatedSessionError };

            // Update Session Signup Panel - Create Audit Event - Increase Stat:
            const [updateMsg, audit, stat] = await Promise.all([
                updateExistingSessionPanel(
                    updatedSessionData,
                    guildSubscription.limits.SHOW_WATERMARK,
                    guildData.data.accent_color,
                    guildData.data.calendar_button
                ),
                createAuditLog({
                    event: AuditEvent.RsvpCreated,
                    guild: guildId,
                    user: userId,
                    meta: {
                        rsvp_id: rsvpId,
                        session_id: sessionId
                    }
                }),
                increaseGuildStat(guildId, "rsvps_assigned", 1)
            ])

            // Succeeded - Return Success:
            return rsvpAddResult.success(updatedSessionData)

        } catch (err) {
            // Log & Return Error:
            createLog.for('Database').error('FAILED to add RSVP - See Details...', { guildId, sessionId, rsvpId, userId, error: err })
            return rsvpAddResult.fail("Unknown", undefined, { message: 'FAILED to add RSVP - See Details...', details: { guildId, sessionId, rsvpId, userId, error: err } })
        }

    },

    /** Used to attempt to remove an assigned user from a specified rsvp slot - returns strictly typed errors. */
    async remove(guildId: string, sessionId: string, rsvpId: string, userId: string) {
        try {
            // Fetch Guild / Session Data:
            const [guild, guildData, guildSubscription] = await Promise.all([
                core.botClient.guilds.fetch(guildId),
                supabase.from('guilds')
                    .select('accent_color, calendar_button, sessions(*, session_rsvp_slots(*, session_rsvps(*)))')
                    .eq('id', guildId)
                    .eq('sessions.id', sessionId)
                    .single(),
                getGuildSubscriptionFromId(guildId)
            ])
            // Confirm Fetched Data:
            if (!guild) return RsvpRemoveResult.fail("Internal", undefined, { message: 'Failed to fetch guild for rsvp removal!', guildId })
            if (!guildData.data || guildData.error) return RsvpRemoveResult.fail('Internal', undefined, { message: 'Database error!', guildData })
            if (!guildSubscription) return RsvpRemoveResult.fail('Internal', undefined, { message: 'Failed to load guild subscription for rsvp removal!', guildData, guildId })
            const sessionData = guildData.data.sessions[0]
            const rsvpSlotData = sessionData?.session_rsvp_slots.find(s => s.id == rsvpId)
            if (!rsvpSlotData) return RsvpRemoveResult.fail('Internal', sessionData, { message: 'Failed to load rsvp slot for rsvp removal!', guildData, guildId, rsvpId, userId })


            // Confirm User is RSVPed to Session/Slot:
            const alreadyInSession = sessionData.session_rsvp_slots.some(s => s.session_rsvps?.some(r => r.user_id == userId))
            if (!alreadyInSession) {
                // User Not Assigned - Return Failure:
                return RsvpRemoveResult.fail("Not RSVPed", sessionData)
            } else {
                // User Assigned - Remove
                const { data, error } = await supabase.from('session_rsvps').delete()
                    .eq('rsvp_slot_id', rsvpId)
                    .eq('session_id', sessionId)
                    .eq('user_id', userId)
                    .select()
                if (error) {
                    return RsvpRemoveResult.fail('Internal', sessionData, { message: 'Failed to remove rsvp slot from user/db!', guildData, guildId, rsvpId, userId, error })
                }


                // Refetch Session:
                const { data: updatedSessionData, error: updatedSessionError } = await supabase.from('sessions')
                    .select('*, session_rsvp_slots(*, session_rsvps(*))')
                    .eq('id', sessionId)
                    .single()
                if (updatedSessionError) throw { message: 'Failed to GET new RSVP data after rsvp assignment...', updatedSessionError };

                // Update Session Signup Panel - Create Audit Event:
                const [updateMsg, audit] = await Promise.all([
                    updateExistingSessionPanel(
                        updatedSessionData,
                        guildSubscription.limits.SHOW_WATERMARK,
                        guildData.data.accent_color,
                        guildData.data.calendar_button
                    ),
                    createAuditLog({
                        event: AuditEvent.RsvpDeleted,
                        guild: guildId,
                        user: userId,
                        meta: {
                            rsvp_id: rsvpId,
                            session_id: sessionId
                        }
                    })
                ])


                // RSVP Removal Success - Return:
                return RsvpRemoveResult.success(sessionData)
            }
        } catch (err) {
            // Log & Return Failure:
            createLog.for('Database').error('FAILED to add RSVP - See Details...', { guildId, sessionId, rsvpId, userId, error: err })
            return RsvpRemoveResult.fail("Unknown", undefined, { message: 'FAILED to add RSVP - See Details...', details: { guildId, sessionId, rsvpId, userId, error: err } })
        }
    }
}