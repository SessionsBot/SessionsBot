
import { defineStore } from "pinia";
import { useAuthStore } from "../auth";
import type { API_SessionTemplateBodyInterface, AppUserGuildData, Database } from "@sessionsbot/shared";

// Define Store:
const useDashboardStore = defineStore("dashboard", {
    state: () => ({
        guild: {
            id: <string | null>null,
            channels: <{ sendable: any[], all: any[] } | null>null,
            sessionTemplates: <Database['public']['Tables']['session_templates']['Row'][] | null>null
        },
        tabs: {
            current: <DashboardTabName>"Sessions"
        },
        sessionForm: {
            visible: false,
            editPayload: <API_SessionTemplateBodyInterface | null>null
        }

    }),

    getters: {

        guildUserData: (state) => {
            const auth = useAuthStore();
            if (!auth.signedIn) {
                console.warn('User Signed Out - Cannot get user guild data...');
                return undefined
            }
            if (state.guild.id) {
                const userData = auth.user?.user_metadata;
                return userData?.guilds.manageable.find(g => g.id == state.guild.id)
            } else {
                console.warn('No Guild Selected - Cannot get user guild data...');
                return undefined
            }
        }


    },

    actions: {

        startNewSessionFormEdit(payload: API_SessionTemplateBodyInterface) {
            this.sessionForm.editPayload = payload as any;
        }

    }

})

// Dashboard Types:
export type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'Subscription';

// Export Store:
export default useDashboardStore;