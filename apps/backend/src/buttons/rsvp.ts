import { ButtonInteraction, MessageFlags } from "discord.js";
import { supabase } from "../utils/database/supabase";

export default {
    data: {
        customId: 'rsvp'
    },
    execute: async (i: ButtonInteraction) => {

        const rsvpId = i.customId.split(':')[1];

        // Fetch RSVP Slot:
        const { data: rsvpSlot, error: rsvpSlotERR } = await supabase.from('session_rsvp_slots')
            .select('*')
            .eq('id', 'rsvp_' + rsvpId)
            .select()
            .single()
        if (rsvpSlotERR) throw rsvpSlotERR;
        if (!rsvpSlot) throw { message: `Failed to fetch rsvp slot by id (${'rsvp_' + rsvpId}) for RSVP button interaction!` }

        // Fetch RSVP Assignees:
        const { data: rsvpAssignees, error: rsvpAssigneesErr } = await supabase.from('session_rsvps')
            .select('*')
            .eq('session_id', rsvpSlot.session_id)
        if (rsvpAssigneesErr) throw rsvpAssigneesErr;

        // Send Response:
        await i.reply({
            content: `Interaction received! - RSVP for \`${rsvpId}\` \nCurrent Capacity: ${rsvpAssignees.length}/${rsvpSlot.capacity}`,
            flags: MessageFlags.Ephemeral
        })

    }
}