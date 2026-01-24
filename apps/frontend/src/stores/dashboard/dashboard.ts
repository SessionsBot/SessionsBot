
import { defineStore } from "pinia";
import { useAuthStore } from "../auth";
import { SubscriptionLevel, type API_SessionTemplateBodyInterface, type Database, } from "@sessionsbot/shared";
import { supabase } from "@/utils/supabase";
import { fetchChannels, fetchRoles, fetchSubscription, fetchTemplates } from "./dashboard.api";
import type { UseAsyncStateReturnBase } from "@vueuse/core";

// Define Store:
const useDashboardStore = defineStore("dashboard_old", {
    state: () => ({

        guild: {
            id: <string | null>null,
            channels: <UseAsyncStateReturnBase<Awaited<ReturnType<typeof fetchChannels>>, [], true> | null>null,
            roles: <UseAsyncStateReturnBase<Awaited<ReturnType<typeof fetchRoles>>, [], true> | null>null,
            sessionTemplates: <UseAsyncStateReturnBase<Awaited<ReturnType<typeof fetchTemplates>>, [], true> | null>null,
            subscription: <UseAsyncStateReturnBase<Awaited<ReturnType<typeof fetchSubscription>>, [], true>>useAsyncState(async () => { return SubscriptionLevel.FREE }, SubscriptionLevel.FREE, { immediate: true })
        },

        nav: {
            currentTab: <DashboardTabName>"Sessions",
            expanded: false,
        },

        sessionForm: {
            visible: false,
            editPayload: <API_SessionTemplateBodyInterface | null>null
        }

    }),

    getters: {
        /** Returns a utility class to handle users dashboard saved guild selection. */
        savedGuildSelection: (state) => {
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

        /** Retrieves the metadata stored form auth user for the currently selected guild id. */
        userGuildData: (state) => {
            const authStore = useAuthStore();
            if (!authStore.signedIn) {
                // console.warn("User is not signed in... cannot fetch `UserGuildData`!")
                return undefined;
            }
            if (state.guild.id) {
                return authStore.user?.user_metadata.guilds.manageable.find(g => g.id == state.guild.id)
            }
            else return undefined;
        },

        /** Returns current dashboard data fetch states/errors. */
        dashboardReady: (state) => {
            const checks = [
                state.guild.channels,
                state.guild.roles,
                state.guild.sessionTemplates,
                state.guild.subscription
            ]
            const errors = checks.filter(s => s?.error != null)?.map(s => s?.error)
            const allReady = checks.every(s => s?.isReady)
            return {
                errors,
                allReady
            }
        },
    },

    actions: {

        /** Gets guild data from api/db when a new guild id has been selected */
        async fetchGuildApiData() {
            // Prepare for Fetch:
            const guild_id = this.guild.id;
            const access_token = (await supabase.auth.getSession()).data?.session?.access_token;
            if (!access_token) return console.warn('No Auth Access Token! - Cannot fetch API data!')
            if (!guild_id) return console.warn('No Guild Id Selected! - Cannot fetch API data!')

            // Get Channels:
            this.guild.channels = useAsyncState(() => fetchChannels(guild_id, access_token), null, {
                immediate: true
            }) as any
            // Get Roles:
            this.guild.roles = useAsyncState(() => fetchRoles(guild_id, access_token), null, {
                immediate: true
            }) as any
            // Get Subscription:
            this.guild.subscription = useAsyncState(() => fetchSubscription(guild_id, access_token), SubscriptionLevel.FREE, {
                immediate: true
            }) as any
            // Get Session Templates:
            this.guild.sessionTemplates = useAsyncState(() => fetchTemplates(guild_id), null, {
                immediate: true
            }) as any
        },

        /** Utility to reset guild related dashboard states. */
        clearGuildStoreData() {
            this.guild = {
                id: null,
                channels: null,
                roles: null,
                subscription: SubscriptionLevel.FREE as any,
                sessionTemplates: null
            }
            this.nav = {
                currentTab: "Sessions",
                expanded: false
            }
        },

        /** Starts (and opens) a new session (template) edit form. */
        startNewSessionFormEdit(payload: API_SessionTemplateBodyInterface) {
            this.sessionForm.editPayload = payload as any;
        },

    }

})

// Dashboard Types:
export type DashboardTabName = 'Sessions' | 'Calendar' | 'Notifications' | 'AuditLog' | 'Preferences';


// Export Store:
export default useDashboardStore;
