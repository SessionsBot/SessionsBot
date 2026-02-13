import { defineStore } from 'pinia';
import { ref } from 'vue';
const cookies = ['analytics_storage', 'ad_storage', 'ad_user_data', 'ad_personalization'] as const;
export type CookieConsentType = typeof cookies[number];

export const useCookieConsent = defineStore('cookieConsent', () => {

    const showCookieUsageAlert = ref<boolean>(false)
    const save_key = 'docs_cookie_consent'


    /** Loads Users Cookie Consent Options - Should be called on app mount */
    function loadConsent() {
        const previousConsent = localStorage.getItem(save_key)
        if (!previousConsent) {
            // show cookie alert:
            showCookieUsageAlert.value = true;
        } else {
            // apply consent opts:
            applyConsent()
        }
    }

    /** Updates & applies users selected cookies preferences. */
    function updateConsent(allowed: typeof cookies[number][]) {
        localStorage.setItem(save_key, JSON.stringify(allowed))
        applyConsent()
    }

    /** Accept's all available cookie technologies & applies consent. */
    function acceptAll() {
        localStorage.setItem(save_key, JSON.stringify(cookies))
        showCookieUsageAlert.value = false
        applyConsent()
    }


    /** Applies consent options directly from `LocalStorage` - should not be called directly!
     * @see {@link loadConsent()} */
    function applyConsent() {

        const allowed: typeof cookies[number][] = JSON.parse(localStorage.getItem(save_key) || '[]')
        // update gtag consent:
        gtag('consent', 'update', {
            'ad_storage': allowed?.includes('ad_storage') ? 'granted' : 'denied',
            'ad_user_data': allowed?.includes('ad_user_data') ? 'granted' : 'denied',
            'ad_personalization': allowed?.includes('ad_personalization') ? 'granted' : 'denied',
            'analytics_storage': allowed?.includes('analytics_storage') ? 'granted' : 'denied',
        });
    }

    // Return States & Methods:
    return {
        showCookieUsageAlert,
        loadConsent,
        updateConsent,
        acceptAll,
        save_key,
    }
})