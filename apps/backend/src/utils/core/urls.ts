import { ENVIRONMENT_TYPE } from "../environment"

const WEBSITE =
    ENVIRONMENT_TYPE === "production"
        ? "https://sessionsbot.fyi"
        : "http://localhost:5173"

const DOCUMENTATION = "https://docs.sessionsbot.fyi"

export const URLS = {
    website: WEBSITE,

    site_links: {
        dashboard: `${WEBSITE}/dashboard`,
        pricing: `${WEBSITE}/pricing`,
        support: `${WEBSITE}/support`,
        session: (sessionId: string) =>
            `${WEBSITE}/session/${sessionId}` as const
    },

    status_page: "https://status.sessionsbot.fyi",

    documentation: DOCUMENTATION,

    doc_links: {
        bot_permissions: DOCUMENTATION
    },

    invite_bot: {
        pretty: "https://invite.sessionsbot.fyi",
        direct:
            ENVIRONMENT_TYPE === "production"
                ? `https://discord.com/oauth2/authorize?client_id=${process.env.DISCORD_CLIENT_ID}`
                : `https://discord.com/oauth2/authorize?client_id=${process.env.DEV_CLIENT_ID}`
    },

    community_server: "https://discord.gg/dKp5HZPjCg",
    support_chat: "https://discord.gg/49gNbwA8t6"
} as const
