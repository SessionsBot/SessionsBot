import { defineStore } from "pinia";


const scrollLock = useScrollLock(window, false)

export const useNavStore = defineStore("nav", {
    state: () => ({
        navOpen: false,
    }),

    actions: {
        openNav() {
            this.navOpen = true;
            scrollLock.value = true;
        },
        closeNav() {
            this.navOpen = false;
            scrollLock.value = false;
        },
        toggleNav() {
            if (!this.navOpen)
                this.openNav()
            else
                this.closeNav()
        },
        toggleBodyScroll(isLocked: boolean) {
            scrollLock.value = isLocked;
        }
    },
});

/** Frequently used external url map */
export const externalUrls = {
    inviteBot: "https://discord.com/oauth2/authorize?client_id=1137768181604302848",
    statusPage: "https://status.sessionsbot.fyi",
    documentation: "https://docs.sessionsbot.fyi",
    gitHub: "https://github.com/SessionsBot",
    discordServer: {
        invite: "https://discord.gg/dKp5HZPjCg",
        supportInvite: "https://discord.gg/49gNbwA8t6",
    },
    /** BEFORE PRODUCTION - SWITCH THIS TO PUBLIC APP STORE URL! */
    discordStore: "https://discord.com/discovery/applications/1380300328179732500/store"
}