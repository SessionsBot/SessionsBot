import { supabase } from "@/utils/supabase";
import { defineStore } from "pinia";
import { useNavStore } from "./nav";
import type { User, UserMetadata } from "@supabase/supabase-js";
import axios, { AxiosError } from "axios";
import { DateTime } from "luxon";
import { TYPE, useToast } from "vue-toastification";
import { CheckSquare2, MessageSquareWarning, TimerReset } from "lucide-vue-next";
import type { RouteRecordRaw } from "vue-router";

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


        async resyncDiscordData(authToken: string, triggerType = <'MANUAL' | 'AUTOMATIC'>'AUTOMATIC', showToast: boolean) {
            const toaster = useToast();
            let toastId = null;

            try {
                // Check/set cooldown
                if (this.$state.refreshStatus != 'idle') {
                    return
                } else this.$state.refreshStatus = 'busy';

                // Check for recent refresh
                if (this.user?.app_metadata?.last_synced) {
                    // Get last sync date:
                    const lastSyncDate = DateTime.fromISO(this.user.app_metadata?.last_synced);
                    const minsFromLastSync = Math.abs(lastSyncDate?.diffNow('minutes')?.minutes || 0);
                    if (minsFromLastSync < 15) { // within past 15 mins - not allowed:
                        this.$state.refreshStatus = 'failed';
                        toaster(`Uh oh! You have to wait at least 15 minuets before refreshing account data again. (Time Remaining: ${Math.floor(15 - minsFromLastSync) || 1} mins)`, { icon: TimerReset, type: TYPE.ERROR, timeout: 8_000, hideProgressBar: false, closeOnClick: false });
                        return;
                    };
                } else throw `Failed to find 'Last Synced' date?`;

                // Show loading notification:
                if (showToast) {
                    toastId = toaster('Resyncing Discord User Data...', { icon: 'pi pi-sync animate-spin', type: TYPE.WARNING, timeout: false, closeButton: false, closeOnClick: false, draggable: false, showCloseButtonOnHover: true });
                };

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
                    this.$state.refreshStatus = 'succeeded';
                    console.info('✅ - REFRESHED SESSION - Success!');

                    // Update toast / notification of success:
                    if (showToast && toastId) toaster.update(toastId, { content: `Success! You're account data has been re-synced with Discord!`, options: { icon: CheckSquare2, type: TYPE.SUCCESS, timeout: 4_000, hideProgressBar: false } });

                } else throw [`Failed to receive a fresh auth token from backend during refresh!`, { fresh_token }];



            } catch (err) {
                // Failed Discord Refresh:
                this.$state.refreshStatus = 'failed';
                console.warn('[❌👤]{REFRESH AUTH}: FAILED - See details', err);
                // Update toast / notification of failure:
                if (showToast && toastId != null) {
                    toaster.update(toastId, { content: `Uh oh! We couldn't resync your Discord Data! You'll have to sign back in using your Discord Account, redirecting you now...`, options: { icon: MessageSquareWarning, type: TYPE.ERROR, timeout: 8_000, hideProgressBar: false, closeOnClick: false } })
                }
                // Redirect new sign in after wait:
                setTimeout(() => {
                    this.signIn();
                }, 4_000);

            } finally {
                // Reset refresh busy flag:
                setTimeout(() => this.$state.refreshStatus = 'idle', 3_000);
                return;
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
                const expiresAt = lastSyncDate.plus({ hours: 24 }).setZone('America/Chicago').toFormat('f');
                if (expiredData) {
                    // last discord data sync >= 24 hours ago
                    console.warn(`[🔁] - Discord Data is stale/expired(${lastSyncDate.setZone('America/Chicago').toFormat('f')}) - Starting a refresh...`);
                    store.resyncDiscordData(session?.access_token, 'AUTOMATIC', false);
                }
            } else return console.warn(`[❌] Auth couldn't find the "Last Discord Sync" date.. (for automatic discord data sync)`);

        }
    })
}