import { Database } from './supabase'

type SessionRsvpSlots = Database['public']['Tables']['session_rsvp_slots']['Row'] & { session_rsvps: Database['public']['Tables']['session_rsvps']['Row'][] }
export type FullSessionData = {
    session_rsvp_slots: SessionRsvpSlots[]
} & Database['public']['Tables']['sessions']['Row'];