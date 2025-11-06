import { supabase } from "@/utils/supabase";
import { defineStore } from "pinia";
import { useNavStore } from "./nav";
import type { UserMetadata } from "@supabase/supabase-js";

export const useAuthStore = defineStore('auth', {
    state: () => ({
        signedIn: false,
        userData: <UserMetadata|undefined>{}
    }),

    actions: {
        signIn() {
            // Direct to Discord oAuth2 Sign In:
            const nav = useNavStore()
            return window.location.assign(nav.externalUrls.discordOAuthSignIn);
        },

        watchAuth() {
            // Watch for auth events:
            supabase.auth.onAuthStateChange(async (event, session) => {
                if(event == 'INITIAL_SESSION'){
                    console.log('[AUTH EVENT] - INITIAL_SESSION', {session})
                    return
                }
                if(event == 'SIGNED_IN'){
                    console.log('user signed in!')
                    this.signedIn = true;
                    this.userData = session?.user?.user_metadata
                    return
                }
                if(event == 'USER_UPDATED'){
                    console.log('user updated!')
                    console.log('session', session)
                    this.signedIn = session?.user ? true : false;
                    this.userData = session?.user?.user_metadata || {}
                    return
                }
                if(event == 'TOKEN_REFRESHED'){
                    console.log('[AUTH EVENT] - Token Refreshed', {session});
                    // authStore.signedIn = true;
                    // authStore.userData = session?.user?.user_metadata
                    return
                }
                if(event == 'SIGNED_OUT'){
                    console.log('[AUTH EVENT] - Signed Out!', {session});
                    this.signedIn = false;
                    this.userData = {};
                    return
                }
            })
            console.log('WATCHING AUTH...')
        },

        async signOut() {
            this.signedIn = false;
            this.userData = {};
            const {error} = await supabase.auth.signOut()
            if(error) console.warn('FAILED TO SIGN OUT', error);
        }
    },
    
})