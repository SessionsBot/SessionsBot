import { createRouter, createWebHistory } from "vue-router";
import Homepage from "./homepage/homepage.vue";
import NotFound from "./notFound.vue";
import MyAccount from "./my-account.vue";

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
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

    {
      path: "/:pathMatch(.*)*",
      name: "NotFound",
      component: NotFound,
    },
  ],
});

export default router;
