import { createRouter, createWebHistory } from "vue-router";
import Homepage from "./homepage/homepage.vue";
import NotFound from "./notFound.vue";
import MyAccount from "./myAccount.vue";
import { externalUrls } from "@/stores/nav";
import PrivacyPolicy from "./privacyPolicy.vue";
import TermsAndConditions from "./termsAndConditions.vue";
import Testing from "./tests/testing.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition;
    }
    return { top: 0, behavior: 'smooth' };
  },
  routes: [
    // Most Visited:
    {
      name: "Homepage",
      path: "/",
      component: Homepage,
    },

    {
      name: "Account",
      path: "/account",
      component: MyAccount,
    },

    // Information:


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

    {
      name: "Testing",
      path: "/testing",
      component: Testing,
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

    // Not Found - 404:
    {
      path: "/:pathMatch(.*)*",
      name: "Not Found",
      component: NotFound,
    },
  ],
});

export default router;
