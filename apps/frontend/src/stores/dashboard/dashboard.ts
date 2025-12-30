
import { defineStore } from "pinia";
import { useAuthStore } from "../auth";
import type { API_SessionTemplateBodyInterface, AppUserGuildData, Database } from "@sessionsbot/shared";
import type { DASHBOARD_Templates } from "./sessionTemplates";


// Define Store:
const useDashboardStore = defineStore("dashboard", {
    state: () => ({
        guild: {
            id: <string | null>null,
            channels: <{ sendable: any[], all: any[] } | null>null,
            sessionTemplates: <DASHBOARD_Templates | null>null
        },
        nav: {
            currentTab: <DashboardTabName>"Sessions",
            expanded: false,
            modeled: false
        },
        sessionForm: {
            visible: false,
            editPayload: <API_SessionTemplateBodyInterface | null>null
        },
        scrollLock: false

    }),

    getters: {
        /** Returns weather the clients screen is considered small or not(<= 640px). */
        // isSmallScreen: () => {
        //     const { width: screenWidth } = useWindowSize();
        //     return screenWidth.value < 640
        // },

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

        /** Gets and returns users guild data for selected guild, or undefined. */
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