import { supabase } from "@/utils/supabase";
import { defineStore } from "pinia";
import { useNavStore } from "./nav";
import type { User, UserMetadata } from "@supabase/supabase-js";
import axios from "axios";
import { DateTime } from "luxon";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        signedIn: false,
        userData: <UserMetadata | undefined>{},
        user: <User | undefined>undefined
    }),

    actions: {

        watchAuth() {
            // Watch for auth events:
            supabase.auth.onAuthStateChange(async (event, session) => {
                this.signedIn = session?.user ? true : false;
                this.user = session?.user;
                this.userData = session?.user?.user_metadata || {};
                console.log(`[👤]{Auth Event} - ${event}`, { signedIn: this.signedIn, user: this.user, userData: this.userData })
                // Check for outdated Discord Data:
                if (this.signedIn) {
                    const lastSyncDate = DateTime.fromISO(this.user?.app_metadata?.last_synced)
                    const staleData = Math.abs(lastSyncDate.diffNow('hours').hours) > 24;
                    console.log({ lastSyncDate: lastSyncDate.toLocaleString(DateTime.DATETIME_FULL), staleData })
                    if (staleData) {
                        await this.resyncDiscordData('AUTOMATIC');
                        console.log('Refreshed Discord Data Automatically!');
                    }
                }
            })
        },

        signIn() {
            // Redirect to Discord oAuth2 Sign In:
            return window.location.assign('https://api.sessionsbot.fyi/auth/discord-sign-in');
        },

        async signOut() {
            this.signedIn = false;
            this.userData = {};
            const { error } = await supabase.auth.signOut()
            if (error) console.warn('FAILED TO SIGN OUT', error);
        },

        async getUserJWT() {
            const { data: { session }, error } = await supabase.auth.getSession();
            return session?.access_token
        },

        async resyncDiscordData(triggerType = 'manual') {
            const userToken = await this.getUserJWT()
            if (!userToken) return console.warn('Cannot update user Discord data - no auth token...');
            await axios.get('https://api.sessionsbot.fyi/auth/discord-refresh', { headers: { Authorization: `Bearer ${userToken}`, 'trigger-type': triggerType } })
                .then(async (res) => {
                    await supabase.auth.refreshSession()
                })
                .catch(async (err) => {
                    console.warn(`[Auth/Discord Refresh]: Error - Please directly sign in again, sorry!`, err);
                    await this.signOut();
                    this.signIn();
                })
        }
    },

})