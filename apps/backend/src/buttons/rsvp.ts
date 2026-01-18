import { ButtonInteraction, ContainerBuilder, MessageFlags, TextDisplayBuilder } from "discord.js";
import { supabase } from "../utils/database/supabase";
import { SubscriptionLevel, SubscriptionSKUs } from "@sessionsbot/shared";

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

        // Get Guild Subscription:
        const subscriptions = i.entitlements.filter(e => (e.isActive() && e.isGuildSubscription)).map(s => s.skuId)
        const currentPlan = () => {
            if (subscriptions.includes(SubscriptionSKUs.ENTERPRISE)) return SubscriptionLevel.ENTERPRISE;
            else if (subscriptions.includes(SubscriptionSKUs.PREMIUM)) return SubscriptionLevel.PREMIUM;
            else return SubscriptionLevel.FREE;
        };

        // If required role(s):
        if (currentPlan().limits.ALLOW_RSVP_ROLE_RESTRICTION && rsvpSlot.roles_required?.length) {

            const requiredRoles = rsvpSlot.roles_required;
            const userRoles = i.member.roles

            console.info('Required Roles', requiredRoles)
            console.info('User Roles', userRoles)

            return await i.reply({
                components: <any>[
                    new ContainerBuilder({
                        components: <any>[
                            new TextDisplayBuilder({ content: `##Required Roles \n\`${requiredRoles}\` \n##User Roles \n\`${userRoles}\`` })
                        ]
                    })
                ],
                flags: MessageFlags.Ephemeral | MessageFlags.IsComponentsV2
            })
        }

        // Send Response:
        await i.reply({
            content: `Interaction received! - RSVP for \`${rsvpId}\``,
            flags: MessageFlags.Ephemeral
        })

    }
}