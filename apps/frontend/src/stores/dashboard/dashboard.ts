
import { defineStore } from "pinia";
import { useAuthStore } from "../auth";
import { SubscriptionLevel, type API_SessionTemplateBodyInterface, type AppUserGuildData, type Database, } from "@sessionsbot/shared";


// Define Store:
const useDashboardStore = defineStore("dashboard", {
    state: () => ({
        guild: {
            id: <string | null>null,
            channels: <{ sendable: any[], all: any[] } | null>null,
            roles: <any[] | null>null,
            sessionTemplates: <Database['public']['Tables']['session_templates']['Row'][] | null>null,
            subscription: SubscriptionLevel.FREE
        },
        nav: {
            currentTab: <DashboardTabName>"Sessions",
            expanded: false,
            // modeled: false
        },
        sessionForm: {
            visible: false,
            editPayload: <API_SessionTemplateBodyInterface | null>null
        },
        scrollLock: false

    }),

    getters: {
        /** Returns a utility class to handle users dashboard saved guild selection. */
        saveGuildSelection: (state) => {
            return class saveGuildChoice {
                static saveKey = 'SGC_Dashboard'
                /** Gets and returns any saved guild selection's id or null. */
                static get() {
                    return sessionStorage.getItem(this.saveKey)
                }
                /** Assigns a new saved guild selection by id. */
                static set(guildId: string) {
                    return sessionStorage.setItem(this.saveKey, guildId)
                }
                /** Assigns the selected dashboard guild to the saved choice, if any. */
                static assign() {
                    const choice = this.get();
                    if (choice) { state.guild.id = choice };
                }
                /** Removes any saved selected dashboard guild. */
                static clear() {
                    return sessionStorage.removeItem(this.saveKey)
                }
            }
        },

    },

    actions: {

        startNewSessionFormEdit(payload: API_SessionTemplateBodyInterface) {
            this.sessionForm.editPayload = payload as any;
        }

    }

})

// Dashboard Types:
export type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'AuditLog' | 'Preferences';

// Export Store:
export default useDashboardStore;