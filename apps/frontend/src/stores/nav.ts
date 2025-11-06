import { defineStore } from "pinia";

export const useNavStore = defineStore("nav", {
  state: () => ({
    navOpen: false,
    externalUrls: {
      inviteBot: "https://invite.sessionsbot.fyi",
      statusPage: "https://status.sessionsbot.fyi",
      gitHub: "https://github.com/SessionsBot",
      discordServer: {
        invite: "https://discord.gg/dKp5HZPjCg",
        supportInvite: "https://discord.gg/49gNbwA8t6",
      },
      discordOAuthSignIn: "http://localhost:3000/api/auth/discord-sign-in",
    },
  }),

  actions: {
    openNav() {
      this.navOpen = true;
    },
    closeNav() {
      this.navOpen = false;
    },
    toggleNav() {
      this.navOpen = !this.navOpen;
    },
  },
});
