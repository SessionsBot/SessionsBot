import { supabase } from "@/utils/supabase";
import { defineStore } from "pinia";
import { useNavStore } from "./nav";
import type { User, UserMetadata } from "@supabase/supabase-js";
import axios, { AxiosError } from "axios";
import { DateTime } from "luxon";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        signedIn: false,
        userData: <UserMetadata | undefined>{},
        user: <User | undefined | null>undefined,
        refreshInProgress: false
    }),

    actions: {

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


        async resyncDiscordData(triggerType = <'MANUAL' | 'AUTOMATIC'>'AUTOMATIC', authToken: string) {

            try {
                // Check/set cooldown
                if (this.$state.refreshInProgress) {
                    return;
                } else this.$state.refreshInProgress = true;

                // Get/fetch user auth token:
                if (!authToken) throw 'Failed to re-sync Discord data! - No auth token provided..';

                // Make refresh request:
                const refreshEndpoint = 'https://api.sessionsbot.fyi/auth/discord-refresh';
                const { status, data: { data: { fresh_token } } } = await axios.get(refreshEndpoint, {
                    headers: { Authorization: `Bearer ${authToken}`, 'trigger-type': triggerType }
                });

                // Handle request response - Fetch new user data:
                if (fresh_token) {
                    await supabase.auth.setSession({
                        access_token: fresh_token,
                        refresh_token: (await supabase.auth.getSession()).data.session?.refresh_token || 'null'
                    });
                    await supabase.auth.refreshSession();
                    console.info('✅ -REFRESHED SESSION - Success!');

                } else throw [`Failed to receive a fresh auth token from backend during refresh!`, { fresh_token }];



            } catch (err) {
                // Failed Discord Refresh:
                console.warn('[❌-👤]{REFRESH AUTH} FAILED... See details', err);
                // Prompt fresh sign in:
                // ! REMOVE ME
                alert('Failed refresh auth data api - prompting fresh login');
                this.signIn();

            } finally {
                // Reset refresh busy flag:
                setTimeout(() => this.$state.refreshInProgress = false, 3_000);
                return;
            }
        },
    },

})


export const watchAuth = async () => {
    const store = useAuthStore();
    // Watch for auth events:
    supabase.auth.onAuthStateChange(async (event, session) => {
        // Get current auth user 
        const user = session?.user;
        // Update auth store:
        store.signedIn = user ? true : false;
        store.user = user;
        store.userData = user?.user_metadata || {};

        console.info(`[👤]{Auth Event} - ${event}`, { signedIn: store.signedIn, user: store.user, userData: store.userData })

        // Check for outdated Discord Data:
        if (store.signedIn && user) {
            const lastSyncISO = user.app_metadata?.last_synced;
            const lastSyncDate = lastSyncISO ? DateTime.fromISO(lastSyncISO) : null;
            if (lastSyncDate && lastSyncDate.isValid) {
                const expiredData = Math.abs(lastSyncDate.diffNow('hours').hours) > 0.05;
                const expiresAt = lastSyncDate.plus({ hours: 0.05 }).setZone('America/Chicago').toFormat('f');
                if (expiredData) {
                    // last discord data sync >= 24 hours ago
                    console.warn(`[🔁] - Discord Data is stale/expired(${lastSyncDate.setZone('America/Chicago').toFormat('f')}) - Starting a refresh...`);
                    store.resyncDiscordData('AUTOMATIC', session?.access_token);
                } else console.info(`[🔁] - Discord Data is not outdated.. - ${lastSyncDate.setZone('America/Chicago').toFormat('f')} \nExpires At: ${expiresAt}`);
            } else return console.warn(`[❌] Auth couldn't find the "Last Discord Sync" date..`);

        }
    })
}