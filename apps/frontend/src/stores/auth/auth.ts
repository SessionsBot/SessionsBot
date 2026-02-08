import { supabase } from "@/utils/supabase";
import { defineStore } from "pinia";
import type { Session } from "@supabase/supabase-js";
import axios from "axios";
import { DateTime } from "luxon";
import type { ResyncResult } from "./authTypes";
import type { AppUser, AppUserMetadata } from "@sessionsbot/shared";
import router from "@/router/router";

/** Debug Auth - Boolean 🏁 */
const debugAuth = false;

/****REACTIVE PINIA STORE** - Auth */
export const useAuthStore = defineStore('auth', {
    state: () => ({
        authReady: false,
        signedIn: false,
        user: <AppUser | undefined>undefined,
        userData: <AppUserMetadata | undefined>undefined,
        session: <Session | undefined>undefined,
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
            // Clear Store State:
            this.signedIn = false;
            this.user = undefined;
            this.userData = undefined;
            this.session = undefined;
            this.refreshStatus = 'idle';
            this.redirectAfterAuth.clear();
            // Signout w/ Supabase
            const { error } = await supabase.auth.signOut()
            if (error) console.warn('[👤] - FAILED TO SIGN OUT', error);
        },

        async resyncDiscordData(authToken: string, triggerType = <'MANUAL' | 'AUTOMATIC'>'AUTOMATIC'): Promise<ResyncResult<any>> {
            const refreshCooldownInMins = 2;
            try {
                // Check/set cooldown
                if (this.refreshStatus != 'idle') {
                    // Already Refreshing - return
                    return {
                        success: false,
                        data: { reason: 'BUSY', message: 'Already refreshing.. please wait!' }
                    }
                } else this.refreshStatus = 'busy';

                // Check for recent refresh
                if (this.user?.app_metadata?.last_synced) {
                    // Get last sync date:
                    const lastSyncDate = DateTime.fromISO(this.user.app_metadata?.last_synced);
                    const minsFromLastSync = Math.abs(lastSyncDate?.diffNow('minutes')?.minutes || 0);
                    const remainingWaitMins = Math.floor(refreshCooldownInMins - minsFromLastSync) >= 1 ? Math.floor(refreshCooldownInMins - minsFromLastSync) + ' mins' : Math.floor((refreshCooldownInMins - minsFromLastSync) * 60) + ' secs';
                    if (minsFromLastSync < refreshCooldownInMins) { // within past 15 mins - not allowed:
                        this.refreshStatus = 'failed';
                        // COOLDOWN - Return
                        return {
                            success: false,
                            data: { reason: 'COOLDOWN', message: `Sorry! You have to wait at least ${refreshCooldownInMins} minuets before each refresh. (Remaining: ${remainingWaitMins})` }
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
                    this.refreshStatus = 'succeeded';
                    console.info('✅ - REFRESHED AUTH SESSION!');

                    // Return Success
                    return {
                        success: true,
                        data: null
                    }

                } else throw { reason: "REFRESH ERROR", message: 'Failed to re-sync Discord data - You\'ll have to sign back in, Sorry! Redirecting you now....' };

            } catch (err: any) {

                // Failed Discord Refresh:
                this.refreshStatus = 'failed';
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
                setTimeout(() => this.refreshStatus = 'idle', 3_000);
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
        store.authReady = true;
        store.signedIn = user ? true : false;
        store.user = user as any;
        store.session = session as any;
        store.userData = user?.user_metadata as any;

        // G-Tag id:
        const gTagId = import.meta.env.VITE_GTAG_ID

        // If Initial Session (first sign in):
        if (event == 'INITIAL_SESSION') {

            // Update G-Tag "user_id" Config:
            if (debugAuth) { console.log('updating', gTagId, user?.id) }
            gtag('config', gTagId, {
                'user_id': user?.id || null
            })
            // Send G-Tag "login" Event:
            gtag('event', 'login', {
                'method': 'Discord'
            })

            // If redirect path (after auth) found:
            const redirectPath = store.redirectAfterAuth.get();
            if (redirectPath) {
                router.push(redirectPath);
                store.redirectAfterAuth.clear();
            }
        }

        // If Signing Out - Update G-Tag:
        if (event == 'SIGNED_OUT') {
            gtag('config', gTagId, {
                'user_id': null
            })
        }

        // Debug:
        if (debugAuth) {
            console.info(`[👤]{Auth Event} - ${event}`, { signedIn: store.signedIn, user: store.user, userData: store.userData })
        }

        // Check for outdated Discord Data:
        if (store.signedIn && user) {
            // Get last synced w/ Discord Date:
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