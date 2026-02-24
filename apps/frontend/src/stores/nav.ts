import { API } from "@/utils/api";
import type { APIResponseValue } from "@sessionsbot/shared";
import { defineStore } from "pinia";

// System Status - Response Type:
type StatusData = {
    id: string,
    name: string,
    description: string,
    availability: number,
    status: string,
}

const scrollLock = useScrollLock(window, false)

export const useNavStore = defineStore('nav', () => {

    // Navigation Menu:
    const navVisible = ref(false);
    function openNav() {
        navVisible.value = true;
        scrollLock.value = true;
    }
    function closeNav() {
        navVisible.value = false;
        scrollLock.value = false;
    }

    // System Status Fetch:
    const systemStatus = useAsyncState(async () => await API.get<APIResponseValue<{
        down: StatusData[],
        up: StatusData[],
        showStatusAlert: boolean
    }>>(`/system/status`), null, {
        onError(e) {
            console.warn('[SYSTEM STATUS] - Failed to fetch! View our status page at https://status.sessionsbot.fyi')
        }
    })


    // Return States & Methods:
    return {
        navVisible,
        openNav,
        closeNav,
        systemStatus
    }
})



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
    discordStore: "https://discord.com/discovery/applications/1137768181604302848/store"
}