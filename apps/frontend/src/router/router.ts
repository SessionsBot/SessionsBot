import { createRouter, createWebHistory, type RouterOptions } from "vue-router";
import { externalUrls } from "@/stores/nav";
import Homepage from "./homepage/homepage.vue";
import NotFound from "./notFound.vue";
import MyAccount from "./account/myAccount.vue";
import PrivacyPolicy from "./privacyPolicy.vue";
import TermsAndConditions from "./termsAndConditions.vue";
import Dashboard from "./dashboard/dashboard.vue";
import Support from "./support/support.vue";
import { useAuthStore } from "@/stores/auth";
import Pricing from "./pricing/pricing.vue";
import TestPage from "./test/TestPage.vue";
import Sessions from "./sessions/Sessions.vue";

// ALL Page Routes:
const routes: RouterOptions['routes'] = [
    // Most Visited:
    {
        name: "Homepage",
        path: "/",
        component: Homepage,
    },
    {
        name: "Dashboard",
        path: "/dashboard",
        component: Dashboard,
    },
    {
        name: "Account",
        path: "/account",
        alias: ['/my-account', '/profile', '/signin', '/sign-in', '/login', '/log-in'],
        component: MyAccount,
    },
    {
        name: "Session",
        path: "/sessions/:sessionId",
        alias: ['/session/:sessionId', '/s/:sessionId'],
        component: Sessions
    },

    // Information:
    {
        name: "Pricing",
        path: '/pricing',
        alias: ['/plans', '/pricing-plans', '/solutions'],
        component: Pricing
    },
    {
        name: "Support",
        path: '/support',
        alias: ['/help', '/faq'],
        component: Support
    },


    // More Resources:
    {
        name: "Privacy",
        path: '/privacy',
        alias: ['/privacy-policy', '/privacy-practices', '/data-practices'],
        component: PrivacyPolicy
    },
    {
        name: "Terms",
        path: '/terms',
        alias: ['/terms-and-conditions', '/agreement', '/terms-of-use', '/terms-of--usage'],
        component: TermsAndConditions
    },


    // External Links:
    {
        name: "Invite Bot",
        path: '/invite',
        component: Homepage,
        beforeEnter: async () => {
            return window.location.assign(externalUrls.inviteBot);
        }
    },

    // Extra - Tests:
    {
        path: '/test',
        name: 'Testing',
        alias: ['/tests', '/testing', '/t'],
        component: TestPage
    },

    // Not Found - 404:
    {
        path: "/:pathMatch(.*)*",
        name: "Not Found",
        component: NotFound,
    },
]


// Main App Router:
const router = createRouter({
    routes,
    history: createWebHistory(import.meta.env.BASE_URL),
    scrollBehavior(to, from, savedPosition) {
        if (savedPosition) {
            return savedPosition;
        }
        return { top: 0, behavior: 'instant' };
    }
});


// Page Title - AFTER Nav Hook:
router.afterEach((to, from, failure) => {
    if (failure) return
    if (to) document.title = `Sessions Bot | ${String(to?.name)}`;
})

export default router;
