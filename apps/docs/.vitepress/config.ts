import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    srcDir: "src",
    lang: 'EN',

    title: "Sessions Bot - Docs",
    description: "An informational guide for all things Sessions Bot!",

    themeConfig: {
        // https://vitepress.dev/reference/default-theme-config
        nav: [
            { text: 'Home', link: '/' },
            { text: 'Getting Started', link: '/getting-started' },

        ],

        logo: '/logo.png',

        sidebar: [
            {
                text: 'Information',
                items: [
                    { text: 'About Sessions Bot', link: '/about' },
                    { text: 'Getting Started', link: '/getting-started' },
                    { text: 'Bot Permissions', link: '/bot-permissions' },
                    { text: 'Subscriptions', link: '/subscriptions' },
                ],
            },

            {
                text: 'Usage',
                items: [

                    { text: 'Commands', link: '/commands' },
                    { text: 'Configurations', link: '/configurations' },

                ],
            }
        ],

        socialLinks: [
            { icon: 'discord', link: 'https://discord.gg/dKp5HZPjCg' },
            { icon: 'github', link: 'https://github.com/SessionsBot/SessionsBot' }
        ],

        footer: {
            copyright: `© ${new Date().getFullYear()} - Sessions Bot`,
            message: 'Thanks for using Sessions Bot!'
        },

        search: {
            provider: 'local'
        },

        externalLinkIcon: true,

        editLink: {
            text: 'Suggest an Edit'
        },

        lastUpdated: {
            formatOptions: {
                dateStyle: 'short',
            },
            text: 'Last Updated'
        }
    }
})
