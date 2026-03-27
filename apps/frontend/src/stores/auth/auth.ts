import { supabase } from "@/utils/supabase";
import { defineStore } from "pinia";
import type { AuthResponse, Session } from "@supabase/supabase-js";
import axios from "axios";
import { DateTime } from "luxon";
import type { ResyncResult } from "./authTypes";
import type { APIResponseValue, AppUser, AppUserAppData, API_DiscordSelfIdentity } from "@sessionsbot/shared";
import router from "@/router/router";
import * as Sentry from '@sentry/vue'
import { safeGTag } from "../analytics";
import { API, apiUrl } from "@/utils/api";
import { identity } from "@vueuse/core";
import useNotifier from "../notifier";

/** Debug Auth - Boolean 🏁 */
const debugAuth = true;

/****REACTIVE PINIA STORE** - Auth */
export const useAuthStore = defineStore('auth', {
    state: () => ({
        authReady: false,
        signedIn: false,
        user: <AppUser | undefined>undefined,
        identity: <API_DiscordSelfIdentity | undefined>undefined,
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
            this.session = undefined;
            this.refreshStatus = 'idle';
            this.redirectAfterAuth.clear();
            // Signout w/ Supabase
            const { error } = await supabase.auth.signOut()
            if (error) console.error('[👤] - FAILED TO SIGN OUT', error);
        },

        async resyncDiscordData(triggerType = <'MANUAL' | 'AUTOMATIC'>'AUTOMATIC'): Promise<ResyncResult> {
            const refreshCooldownInMins = 2;
            try {
                // Check/set cooldown
                if (this.refreshStatus != 'idle') {
                    // Already Refreshing - return
                    return {
                        success: false,
                        data: { reason: 'BUSY', message: 'Already refreshing.. please wait!' }
                    } as const
                } else this.refreshStatus = 'busy';

                // Check for recent refresh
                if (this.user?.app_metadata?.last_synced) {
                    // Get last sync date:
                    const lastSyncDate = DateTime.fromISO(this.user?.app_metadata?.last_synced);
                    const minsFromLastSync = Math.abs(lastSyncDate?.diffNow('minutes')?.minutes || 0);
                    const remainingWaitString = Math.floor(refreshCooldownInMins - minsFromLastSync) >= 1 ? Math.floor(refreshCooldownInMins - minsFromLastSync) + ' mins' : Math.floor((refreshCooldownInMins - minsFromLastSync) * 60) + ' secs';
                    if (minsFromLastSync < refreshCooldownInMins) { // within cooldown - not allowed:
                        this.refreshStatus = 'failed';
                        // COOLDOWN - Return
                        return {
                            success: false,
                            data: { reason: 'COOLDOWN', message: `Sorry! You have to wait at least ${refreshCooldownInMins} minuets before each refresh. (Remaining: ${remainingWaitString})` }
                        } as const;
                    };
                } else // throw { reason: 'NO SYNC DATE', message: 'Failed to find previous data sync date!' };


                    // Get/fetch user auth token:
                    if (!this.session?.access_token) throw { reason: 'NO TOKEN', message: 'Failed to re-sync Discord data! - No auth token provided..' };

                // Make refresh request:
                const { status, data } = await API.get<APIResponseValue<any>>('/auth/discord-refresh', {
                    headers: {
                        ['trigger-type']: triggerType
                    },
                    timeout: 10_000,
                    timeoutErrorMessage: 'API Timeout! - Refresh Auth Endpoint FAILED to respond within 10 secs...'
                });

                if (status < 299) {
                    // API Success - Attempt to Refresh Auth Token (Supabase):

                    // Attempt Supabase Token Refresh:
                    const { data, error } = await supabase.auth.refreshSession()
                    if (error) throw { message: 'Supabase auth refresh call - Errored!', error }

                    // Log & Return Refresh Success:
                    this.refreshStatus = 'succeeded';
                    console.info('✅ - REFRESHED AUTH SESSION!');
                    return {
                        success: true,
                        data: {
                            triggerType,
                        }
                    } as const

                } else throw { reason: "REFRESH ERROR", message: 'Failed to refresh auth session from API - You\'ll have to sign back in... Sorry! Redirecting you now....', result: data, status };


            } catch (err: any) {

                // Failed Discord Refresh:
                this.refreshStatus = 'failed';
                console.error('[❌👤]{REFRESH AUTH}: FAILED', err);

                // Redirect new sign in after wait:
                setTimeout(() => {
                    const route = useRoute()
                    // Check if last sign in is older than 5 days:
                    const lastSyncISO = this.user?.app_metadata?.last_synced
                    const lastSyncDate = lastSyncISO ? DateTime.fromISO(lastSyncISO) : null;
                    if (lastSyncDate?.isValid && (Math.abs(lastSyncDate.diffNow('day')?.days ?? 0 > 5))) {
                        // Force a fresh sign in:
                        console.info(`(i) Prompting fresh sign in due to failed auth refresh and expiring discord token!`)
                        this.signIn(route?.fullPath);
                    }

                }, 1_000);

                // Return Failure:
                return {
                    success: false,
                    data: {
                        reason: err?.reason || 'REFRESH ERROR',
                        message: err?.message || `Failed to refresh account data, you'll have to sign back in! (redirecting you now...)`
                    }
                } as const

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
    const notifier = useNotifier();

    // Util: Fetch Discord Identity:
    async function fetchSelfIdentity(token: string | undefined) {
        try {
            // Confirm Token:
            if (!token) throw 'No token provided to fetch identity!'
            // Make API Request:
            const result = await axios.get<APIResponseValue>(apiUrl + '/discord/identity/@me', {
                headers: {
                    Authorization: `Bearer ${token}`
                },
                validateStatus: (s) => true
            })
            // Handle Response:
            if (!result.data?.success) {
                // Identity Fetch Failed:
                console.error(`[👤 Auth]: Failed to fetch SELF Discord IDENTITY!`, { api_result: result })
                throw { message: 'API Result Failure', api_result: result }
            } else {
                store.identity = result.data.data as any;
                if (debugAuth) console.info(`[👤 Auth]: Fetched Discord Identity - @me`, store.identity)

                // Update Sentry User w/ Identity:
                Sentry.setUser({
                    id: store.identity?.id,
                    username: store.identity?.username
                })

                store.authReady = true;
            }
        } catch (err) {
            console.error(`[AUTH 👤]: Failed to fetch self user Discord identity!`, err)
            // store.signOut()
            // Send Alert:
            notifier.send({
                level: 'error',
                duration: 15_000,
                icon: 'tdesign:user-error-1-filled',
                header: `Failed to load account identity!`,
                content: 'It seems we ran into an authentication error! <br><span class="mt-0.5 text-xs opacity-65"> <b>TIP:</b> Try refreshing the page or signing out and back in.</span>'
            })
        }
    }

    // Watch for auth events:
    supabase.auth.onAuthStateChange(async (event, session) => {
        // Get current auth user 
        const user = session?.user;
        // Update auth store:
        store.signedIn = user ? true : false;
        store.user = user as any;
        store.session = session as any;

        // G-Tag id:
        const gTagId = import.meta.env.VITE_GTAG_ID

        // If Initial Session (first sign in):
        if (event == 'INITIAL_SESSION') {
            // If signed in:
            if (session?.access_token) {
                // If redirect path (after auth) found:
                const redirectPath = store.redirectAfterAuth.get();
                if (redirectPath) {
                    router.push(redirectPath);
                    store.redirectAfterAuth.clear();
                }

                // Fetch Identity Data
                await fetchSelfIdentity(session?.access_token)

                // Set gTag Config:
                safeGTag('config', gTagId, {
                    'user_id': user?.id || null
                })
                // Send G-Tag "login" Event:
                safeGTag('event', 'login', {
                    'method': 'Discord'
                })

                // Check for outdated Discord Data:
                if (store.signedIn && user) {
                    // Get last synced w/ Discord Date:
                    const lastSyncISO = user.app_metadata?.last_synced;
                    const lastSyncDate = lastSyncISO ? DateTime.fromISO(lastSyncISO) : null;
                    if (lastSyncDate && lastSyncDate.isValid) {
                        const expiredData = Math.abs(lastSyncDate.diffNow('hours').hours) > 3 // 3 days
                        if (expiredData && store.refreshStatus == 'idle') {
                            // last discord data sync >= 24 hours ago
                            console.info(`[🔁] - Discord Data is stale/expired(${lastSyncDate.setZone('America/Chicago').toFormat('f')}) - Starting a refresh...`);
                            // auto refresh acc data:
                            const result = await store.resyncDiscordData('AUTOMATIC');
                            if (result.success) safeGTag('event', 'auth_refresh', {
                                trigger_type: result.data?.triggerType
                            })
                        }
                    } else console.warn(`[❌] Auth couldn't find the "Last Discord Sync" date.. (for automatic discord data sync)`);

                }

            } else {
                // Mark Auth Ready:
                store.authReady = true
            }
        }

        // If Signing Out - Update G-Tag:
        if (event == 'SIGNED_OUT') {
            // Reset Sentry & GA Users
            safeGTag('event', 'logout')
            safeGTag('config', gTagId, {
                'user_id': null
            })
            Sentry.setUser(null)
            store.identity = undefined
        }

        // On Refresh - Update Identity:
        if (event == 'TOKEN_REFRESHED') {
            //  Re-Fetch Identity Data:
            await fetchSelfIdentity(session?.access_token)
        }

        // Reset Identity
        if (!session) {
            store.identity = undefined
        }

        // Debug:
        if (debugAuth) {
            console.info(`[👤]{Auth Event} - ${event}`, { signedIn: store.signedIn, user: store.user, identity: store.identity })
        }


    })

    // Auth Ready - Timed Out Alert:
    await new Promise((r) => {
        setTimeout(() => {
            if (!store.authReady) {
                notifier.send({
                    level: 'error',
                    header: 'Failed to load Account!',
                    icon: 'mdi:user',
                    duration: false,
                    content: `It appears we're having trouble initiating our account system.. please refresh this page and try again, or else get in contact with our Support Team!`
                })
            }
        }, 10_000);
    })
}