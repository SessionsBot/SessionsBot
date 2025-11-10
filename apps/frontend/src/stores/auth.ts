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
        user: <User | undefined>undefined,
        refreshInProgress: false
    }),

    actions: {

        watchAuth() {
            // Watch for auth events:
            supabase.auth.onAuthStateChange(async (event, session) => {
                // Get current auth user 
                const user = session?.user;
                // Update auth store:
                this.signedIn = user ? true : false;
                this.user = user;
                this.userData = user?.user_metadata || {};

                console.info(`[👤]{Auth Event} - ${event}`, { signedIn: this.signedIn, user: this.user, userData: this.userData })

                // Check for outdated Discord Data:
                if (this.signedIn && user) {
                    const lastSyncISO = user.app_metadata?.last_synced;
                    const lastSyncDate = lastSyncISO ? DateTime.fromISO(lastSyncISO) : null;
                    if (lastSyncDate && lastSyncDate.isValid) {
                        const expiredData = Math.abs(lastSyncDate.diffNow('hours').hours) > 0.05;
                        const expiresAt = lastSyncDate.plus({ hours: 0.05 }).setZone('America/Chicago').toFormat('f');
                        if (expiredData) { // last discord data sync >= 24 hours ago
                            console.warn(`[👤] - Discord Data is stale/expired(${lastSyncDate.setZone('America/Chicago').toFormat('f')}) - Starting a refresh...`)
                            await this.resyncDiscordData('MANUAL', session?.access_token);
                            console.info('[✔] - Completed refresh (allegedly)')
                        } else console.info(`[👤] - Discord Data is not outdated.. - ${lastSyncDate.setZone('America/Chicago').toFormat('f')} \nExpires At: ${expiresAt}`)
                    } else console.warn(`[👤] Auth couldn't find the "Last Discord Sync" date..`)

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


        async resyncDiscordData(triggerType = <'MANUAL' | 'AUTOMATIC'>'AUTOMATIC', token?: string) {
            try {
                // Check cooldown
                if (this.refreshInProgress) {
                    return console.warn('Slow down! Already refreshing...');
                }
                this.refreshInProgress = true;

                // Get/fetch user auth token:
                let authToken = token || await this.getUserJWT();
                if (!authToken) throw 'Failed to re-sync Discord data! - No auth token provided..';

                // Make refresh request:
                const refreshEndpoint = 'https://api.sessionsbot.fyi/auth/discord-refresh'
                const { status, data } = await axios.get(refreshEndpoint, {
                    headers: { Authorization: `Bearer ${authToken}`, 'trigger-type': triggerType },
                    timeout: 10000,
                    validateStatus: (s) => s < 500
                });

                if (status < 300) {
                    console.log('Refresh from backend success - reloading session...')
                    await supabase.auth.refreshSession()
                    console.log('Session reloaded')
                } else throw ['STATUS ERR', data]

            } catch (err) {
                // Failed Discord Refresh:
                console.warn('[👤]{REFRESH API} FAILED', err);
            } finally {
                this.refreshInProgress = false;
            }
        },

        async resyncDiscordDataOLD(triggerType = 'manual', token?: string) {
            // Check cooldown
            if (this.refreshInProgress) {
                console.warn('Duplicate refresh data call - already in progress');
                return;
            }
            this.refreshInProgress = true;

            console.info('REFRESH CALLED!')

            const refreshEndpoint = 'https://regional-melloney-sessions-bot-630bded7.koyeb.app/api/auth/discord-refresh';
            // Send refresh api request
            console.log('SENDING AUTH DATA REFRESH API CALL');


            try {
                // get provided token / or fetch current:
                let userToken = token || await this.getUserJWT();

                if (!userToken) {
                    console.warn('Cannot update user Discord data - no auth token available.');
                    return;
                }

                console.log('sending with user token (redacted):', userToken.slice(0, 8) + '...');

                const { status, data } = await axios.get(refreshEndpoint, {
                    headers: { Authorization: `Bearer ${userToken}`, 'trigger-type': triggerType },
                    timeout: 10000,
                    validateStatus: (s) => s < 500
                });

                console.info('REFRESH RESPONSE status:', status, 'data:', data);

                if (status >= 300) throw { data, status };

                await supabase.auth.refreshSession();
                return data;
            } catch (err) {
                if (axios.isAxiosError(err)) {
                    console.warn('[👤]{REFRESH API} FAILED - axios error', err.message, err.response?.status, err.response?.data);
                } else {
                    console.warn('[👤]{REFRESH API} FAILED', err);
                }
            } finally {
                // ALWAYS reset flag so future attempts can run
                this.refreshInProgress = false;
                console.log('refreshInProgress reset to false');
            }

            console.log('AFTER FINALLY')
        },

    },

})