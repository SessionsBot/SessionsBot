import { defineStore } from "pinia";

export const useNavStore = defineStore("nav", {
    state: () => ({
        navOpen: false,

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

/** Frequently used external url map */
export const externalUrls = {
    inviteBot: "https://discord.com/oauth2/authorize?client_id=1137768181604302848",
    statusPage: "https://status.sessionsbot.fyi",
    gitHub: "https://github.com/SessionsBot",
    discordServer: {
        invite: "https://discord.gg/dKp5HZPjCg",
        supportInvite: "https://discord.gg/49gNbwA8t6",
    }
}