import { ENVIRONMENT_TYPE } from "../environment"


class BackendURLs {
    // Website / App Links:
    public website = 'https://sessionsbot.fyi'
    public site_links = {
        dashboard: this.website + '/dashboard',
        pricing: this.website + '/pricing',
        support: this.website + '/support',
        session: (sessionId: string) => `${this.website}/session/${sessionId}`
    }
    public status_page = 'https://status.sessionsbot.fyi'

    // Documentation Links:
    public documentation = 'https://docs.sessionsbot.fyi'
    public doc_links = {
        bot_permissions: this.documentation,

    }

    // Discord Related URLs:
    public invite_bot = {
        pretty: 'https://invite.sessionsbot.fyi',
        direct: ENVIRONMENT_TYPE == 'production'
            ? `https://discord.com/oauth2/authorize?client_id=${process.env?.['DISCORD_CLIENT_ID']}` // production bot
            : `https://discord.com/oauth2/authorize?client_id=${process.env?.['DEV_CLIENT_ID']}` // development bot
    }
    public community_server = 'https://discord.gg/dKp5HZPjCg'
    public support_chat = 'https://discord.gg/49gNbwA8t6'
}




export const URLS = new BackendURLs()

// OVERRIDE URLS IN DEVELOPMENT ENVIRONMENT(s):
if (ENVIRONMENT_TYPE != 'production') {
    // console.info('(i) overriding urls in non-production environment!')
    URLS.website = 'http://localhost:5173/'
}