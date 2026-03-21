import { defineStore } from "pinia";
import * as Sentry from '@sentry/vue'
import type { App } from "vue";
import { supabase } from "@/utils/supabase";

/** Util - Await Gtag is ready */
function waitForGtag(timeout = 2000): Promise<boolean> {
    return new Promise((res) => {
        const start = Date.now();
        const interval = setInterval(() => {
            if (typeof window.gtag === 'function') {
                clearInterval(interval);
                res(true); // gtag found
            }
            if (Date.now() - start > timeout) {
                clearInterval(interval);
                res(false); // failed to get gtag
            }
        }, 50);
    });
}

/** Safe GTag Usage Utility */
export function safeGTag(...args: any[]) {
    if (typeof window.gtag == 'function') {
        window.gtag(args)
    } else console.warn('GTag not available...', args)
}

// Analytics Store:
const useAnalyticsStore = defineStore('analytics', () => {

    // Cookie Preference Option / Categories:
    type CookiePreference = 'necessary' | 'preferences' | 'analytics' | 'marketing'
    const cookiePreferences = reactive<Record<CookiePreference, boolean>>({
        necessary: true,
        preferences: false,
        analytics: false,
        marketing: false
    })


    // Cookie Consent - Initialization & Updates:
    const useCookieConsent = () => {

        const save_key = 'cookie-consent'

        const showCookieAlert = ref(false);
        const showManagePreferences = ref(false);

        function openPreferences(autoToggle: boolean) {
            if (autoToggle) {
                cookiePreferences.preferences = true;
                cookiePreferences.analytics = true;
                cookiePreferences.marketing = true;
            }
            showManagePreferences.value = true
        }

        /** Used to **CHECK** if user has saved cookie preferences or not.
         * @no_preferences shows cookie consent/preferences alert
         * @preferences_saved applies google analytics const mode options. */
        async function init() {
            // Load Saved Cookie Preferences:
            const rawSave = localStorage.getItem(save_key)
            if (!rawSave) {
                // No Preferences - Show Cookie Consent Alert...
                console.info('No Cookie Preferences - Please Confirm...')
                // Show Cookie Notification:
                showCookieAlert.value = true;
            } else {
                // Preferences Found - Assign saved choices to store:
                const allowedCookies: CookiePreference[] = JSON.parse(rawSave)
                for (const cookie of allowedCookies) {
                    cookiePreferences[cookie] = true;
                }
                // Apply Consent Choices:
                await applyConsent()
            }
        }

        /** Updates/saves currently selected cookies to allow to local storage. (closes preferences panel) */
        async function savePreferences() {
            return await new Promise((r) => {
                // Get Current Options:
                const allowed = Object.entries(cookiePreferences).filter(([n, e]) => e).map(([n, e]) => n)
                // Save/Update Selected Opts to LocalStorage:
                if (allowed?.length) localStorage.setItem(save_key, JSON.stringify(allowed))
                else localStorage.setItem(save_key, '[]')
                // Close Preferences Panel:
                showManagePreferences.value = false;
                // Resolve:
                return r({ result: 'Cookie Preferences Updated to Local Storage!', preferences: cookiePreferences })
            })

        }

        /** Marks **ALL** cookies as GRANTED on call. */
        async function acceptAll() {
            for (const key of Object.keys(cookiePreferences)) {
                // @ts-expect-error
                cookiePreferences[key] = true;
            }
            // Update Cookie Options to Storage:
            await savePreferences()
            // Apply Consent Options:
            await applyConsent()
        }

        /** **APPLIES CONSENT OPTIONS** to `gtag` after call. */
        async function applyConsent() {
            // Await gtag and get preferences:
            const ready = await waitForGtag()
            if (!ready) return console.warn('gtag was NOT ready to apply consent options..')
            const allowedCookies: CookiePreference[] = JSON.parse(localStorage.getItem(save_key) || '[]')

            // Update gtag - Consent Mode:
            const adCookies = allowedCookies.includes('marketing');
            const analyticsCookies = allowedCookies.includes('analytics');

            gtag('consent', 'update', {
                'ad_storage': adCookies ? 'granted' : 'denied',
                'ad_user_data': adCookies ? 'granted' : 'denied',
                'ad_personalization': adCookies ? 'granted' : 'denied',
                'analytics_storage': analyticsCookies ? 'granted' : 'denied'
            });
        }

        // Return States & Methods:
        return {
            init,
            openPreferences,
            savePreferences,
            acceptAll,
            applyConsent,
            showCookieAlert,
            showManagePreferences
        }
    }
    const cookieConsent = useCookieConsent();


    // + Return States & Methods:
    return {
        cookiePreferences,
        cookieConsent,
    }
})

// Initialize Sentry:
export async function initializeSentry(app: App) {
    const envMode = import.meta.env.MODE;
    if (envMode == 'development') return console.warn('(i) Sentry NOT initialized in development environments...')
    Sentry.init({
        app,
        dsn: "https://DX4e7boeLWD2emwP1hYmFko7@s2166264.eu-fsn-3.betterstackdata.com/777",
        tracesSampleRate: 1.0,
        integrations: [
            Sentry.captureConsoleIntegration({
                levels: ['warn', 'error'],
            }),
            Sentry.supabaseIntegration({
                supabaseClient: supabase
            })
        ],
        release: `@sessionsbot/web-app-v${__APP_VERSION}`,
        environment: envMode,
    })
}

// Export Store:
export default useAnalyticsStore