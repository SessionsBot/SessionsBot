import { defineStore } from "pinia";

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

        /** Used to **CHECK** if user has saved cookie preferences or not.
         * @no_preferences shows cookie consent/preferences alert
         * @preferences_saved applies google analytics const mode options. */
        async function init() {
            // Load Saved Cookie Preferences:
            const rawSave = localStorage.getItem(save_key)
            if (!rawSave) {
                // No Preferences - Show Cookie Consent Alert...
                console.warn('No Cookie Preferences - Please Confirm...')
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

        /** Updates/saves currently selected cookies to allow to local storage. */
        async function savePreferences() {
            return await new Promise((r) => {
                // Get Current Options:
                const allowed = Object.entries(cookiePreferences).filter(([n, e]) => e).map(([n, e]) => n)
                // Save/Update Selected Opts to LocalStorage:
                if (allowed?.length) localStorage.setItem(save_key, JSON.stringify(allowed))
                else localStorage.setItem(save_key, '[]')
                // Resolve:
                return r({ result: 'Cookie Preferences Updated to Local Storage!', preferences: cookiePreferences })
            })

        }

        /** Marks **ALL** cookies as allowed. */
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
            savePreferences,
            acceptAll,
            applyConsent,
            showManagePreferences,
            showCookieAlert
        }
    }
    const cookieConsent = useCookieConsent();


    // + Return States & Methods:
    return {
        cookiePreferences,
        cookieConsent,
    }
})

// Export Store:
export default useAnalyticsStore