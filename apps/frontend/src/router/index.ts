import { createRouter, createWebHistory } from "vue-router";
import Homepage from "./homepage/homepage.vue";
import NotFound from "./notFound.vue";
import MyAccount from "./account/myAccount.vue";
import { externalUrls } from "@/stores/nav";
import PrivacyPolicy from "./privacyPolicy.vue";
import TermsAndConditions from "./termsAndConditions.vue";
import Test_Form1 from "./tests/form1/testing.vue";
import Test_Form2 from "./tests/form2/sesForm.vue";

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
      name: "Testing Form 1",
      path: "/test/1",
      component: Test_Form1,
    },

    {
      name: "Testing Form 2",
      path: "/test/2",
      component: Test_Form2,
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
