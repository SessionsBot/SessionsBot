import { supabase } from "@/utils/supabase";
import { defineStore } from "pinia";
import { useNavStore } from "../nav";
import type { User, UserMetadata } from "@supabase/supabase-js";
import axios, { AxiosError } from "axios";
import { DateTime } from "luxon";
import { TYPE, useToast } from "vue-toastification";
import { CheckSquare2, MessageSquareWarning, TimerReset } from "lucide-vue-next";
import type { RouteRecordRaw } from "vue-router";
import { BasicResult, BasicResult as result } from "@sessionsbot/shared"
import type { ResyncResult } from "./authTypes";


/****REACTIVE PINIA STORE** - Auth */
export const useAuthStore = defineStore('auth', {
    state: () => ({
        signedIn: false,
        userData: <UserMetadata | undefined>{},
        user: <User | undefined | null>undefined,
        refreshStatus: <'idle' | 'busy' | 'succeeded' | 'failed'>'idle',
        redirectAfterAuth: {
            get: () => {
                return localStorage.getItem('redirect-after-auth');
            },
            set: (path: string) => {
                return localStorage.setItem('redirect-after-auth', path);
            },
            clear: () => {
                return localStorage.removeItem('redirect-after-auth');
            }
        },
    }),

    actions: {

        signIn(directAfterSignIn?: string) {
            if (directAfterSignIn) {
                this.redirectAfterAuth.set(directAfterSignIn);
            }
            // Redirect to Discord oAuth2 Sign In:
            return window.location.assign('https://api.sessionsbot.fyi/auth/discord-sign-in');
        },

        async signOut() {
            this.signedIn = false;
            this.userData = {};
            const { error } = await supabase.auth.signOut()
            if (error) console.warn('[👤] - FAILED TO SIGN OUT', error);
        },



        async getUserJWT() {
            const { data: { session }, error } = await supabase.auth.getSession();
            return session?.access_token
        },


        async resyncDiscordData(authToken: string, triggerType = <'MANUAL' | 'AUTOMATIC'>'AUTOMATIC'): Promise<ResyncResult<any>> {

            try {
                // Check/set cooldown
                if (this.$state.refreshStatus != 'idle') {
                    // Already Refreshing - return
                    return {
                        success: false,
                        data: { reason: 'BUSY', message: 'Already refreshing.. please wait!' }
                    }
                } else this.$state.refreshStatus = 'busy';

                // Check for recent refresh
                if (this.user?.app_metadata?.last_synced) {
                    // Get last sync date:
                    const lastSyncDate = DateTime.fromISO(this.user.app_metadata?.last_synced);
                    const minsFromLastSync = Math.abs(lastSyncDate?.diffNow('minutes')?.minutes || 0);
                    const remainingWaitMins = Math.floor(15 - minsFromLastSync) >= 1 ? Math.floor(15 - minsFromLastSync) : '1>';
                    if (minsFromLastSync < 15) { // within past 15 mins - not allowed:
                        this.$state.refreshStatus = 'failed';
                        // COOLDOWN - Return
                        return {
                            success: false,
                            data: { reason: 'COOLDOWN', message: `Sorry! You have to wait at least 15 minuets before each refresh. (Remaining: ${remainingWaitMins} mins)` }
                        };
                    };
                } else throw { reason: 'NO SYNC DATE', message: 'Failed to find previous data sync date!' };


                // Get/fetch user auth token:
                if (!authToken) throw { reason: 'NO TOKEN', message: 'Failed to re-sync Discord data! - No auth token provided..' };

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
                    this.$state.refreshStatus = 'succeeded';
                    console.info('✅ - REFRESHED AUTH SESSION!');

                    // Return Success
                    return {
                        success: true,
                        data: null
                    }

                } else throw { reason: "REFRESH ERROR", message: 'Failed to re-sync Discord data - You\'ll have to sign back in, Sorry! Redirecting you now....' };



            } catch (err: any) {

                // Failed Discord Refresh:
                this.$state.refreshStatus = 'failed';
                console.warn('[❌👤]{REFRESH AUTH}: FAILED - See details', err);

                // Redirect new sign in after wait:
                setTimeout(() => {
                    this.signIn();
                }, 4_000);

                // Return Failure:
                return {
                    success: false,
                    data: {
                        reason: err?.reason || 'REFRESH ERROR',
                        message: err?.message || `Failed to refresh account data, you'll have to sign back in! (redirecting you now...)`
                    }
                }

            } finally {
                // Reset refresh busy flag:
                setTimeout(() => this.$state.refreshStatus = 'idle', 3_000);
            }
        },
    },

})


/****Util:** Supabase Auth Went Listener 
 * - Handles auth events and keeps user in `useAuthStore()` up to date. */
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

        // If Initial Session w/ Redirect after Auth:
        const redirectPath = store.redirectAfterAuth.get();
        if (event == 'INITIAL_SESSION' && redirectPath) {
            console.info('INITIAL SESSION with after auth redirect to:', redirectPath);
            const router = useRouter();
            router.push(redirectPath);
            store.redirectAfterAuth.clear();
        }

        // Check for outdated Discord Data:
        if (store.signedIn && user) {
            const lastSyncISO = user.app_metadata?.last_synced;
            const lastSyncDate = lastSyncISO ? DateTime.fromISO(lastSyncISO) : null;
            if (lastSyncDate && lastSyncDate.isValid) {
                const expiredData = Math.abs(lastSyncDate.diffNow('hours').hours) > 24;
                if (expiredData && store.refreshStatus == 'idle') {
                    // last discord data sync >= 24 hours ago
                    console.warn(`[🔁] - Discord Data is stale/expired(${lastSyncDate.setZone('America/Chicago').toFormat('f')}) - Starting a refresh...`);
                    // auto refresh acc data:
                    store.resyncDiscordData(session?.access_token, 'AUTOMATIC');
                }
            } else return console.warn(`[❌] Auth couldn't find the "Last Discord Sync" date.. (for automatic discord data sync)`);

        }
    })
}