import { supabase } from "@/utils/supabase";
import { defineStore } from "pinia";
import { useNavStore } from "./nav";
import type { UserMetadata } from "@supabase/supabase-js";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        signedIn: false,
        userData: <UserMetadata | undefined>{},
        // Is that below overkill? / will it run each time a nav is created in a component or just once for the store in general?
        user: computedAsync(async (onCancel) => { const { data: { user } } = await supabase.auth.getUser(); return user; }),
    }),

    actions: {
        signIn() {
            // Direct to Discord oAuth2 Sign In:
            const nav = useNavStore()
            return window.location.assign('https://api.sessionsbot.fyi/auth/discord-sign-in');
        },

        watchAuth() {
            // Watch for auth events:
            supabase.auth.onAuthStateChange(async (event, session) => {
                if (event == 'INITIAL_SESSION') {
                    console.log('[AUTH EVENT] - INITIAL_SESSION', { session })
                    return
                }
                if (event == 'SIGNED_IN') {
                    console.log('user signed in!')
                    this.signedIn = true;
                    this.userData = session?.user?.user_metadata
                    return
                }
                if (event == 'USER_UPDATED') {
                    console.log('user updated!')
                    console.log('session', session)
                    this.signedIn = session?.user ? true : false;
                    this.userData = session?.user?.user_metadata || {}
                    return
                }
                if (event == 'TOKEN_REFRESHED') {
                    console.log('[AUTH EVENT] - Token Refreshed', { session });
                    this.signedIn = true;
                    this.userData = session?.user?.user_metadata
                    return
                }
                if (event == 'SIGNED_OUT') {
                    console.log('[AUTH EVENT] - Signed Out!', { session });
                    this.signedIn = false;
                    this.userData = {};
                    return
                }
            })
            console.log('WATCHING AUTH...')
        },

        async getUserJWT() {
            const { data: { session }, error } = await supabase.auth.getSession();
            return session?.access_token
        },

        async signOut() {
            this.signedIn = false;
            this.userData = {};
            const { error } = await supabase.auth.signOut()
            if (error) console.warn('FAILED TO SIGN OUT', error);
        }
    },

})