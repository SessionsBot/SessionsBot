import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'

// https://vitepress.dev/reference/site-config
export default defineConfig({
    srcDir: "src",

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
                collapsed: false,
                text: 'Information',
                items: [
                    { text: 'About Sessions Bot', link: '/about' },
                    { text: 'Getting Started', link: '/getting-started' },
                    { text: 'Bot Permissions', link: '/bot-permissions' },
                    { text: 'Subscriptions', link: '/subscriptions' },
                ],
            },

            {
                collapsed: false,
                text: 'Usage',
                items: [

                    { text: 'Commands', link: '/commands' },
                    {
                        text: 'Sessions', link: '#', base: '/sessions', items: [
                            {
                                text: 'Schedules', link: '#schedules',
                            },
                            {
                                text: 'RSVPS', link: '#rsvps'
                            }
                        ]
                    },
                    { text: 'Preferences', link: '/preferences' },

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
    },

    head: [
        // Google Analytics:
        [
            'script',
            { async: '', src: 'https://www.googletagmanager.com/gtag/js?id=G-EV6Y942G4B' }
        ],
        [
            'script',
            {}, `
            // Define Data Layer & gtag:
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            // Consent Defaults:
            gtag('consent', 'default', {
                'ad_storage': 'denied',
                'ad_user_data': 'denied',
                'ad_personalization': 'denied',
                'analytics_storage': 'denied',
                'wait_for_update': 10000
            });
            // Initial Event
            gtag('js', new Date());
            gtag('config', 'G-EV6Y942G4B');
            `
        ]
    ],

    vite: {
        plugins: [
            tailwindcss(),
        ],
        resolve: {
            alias: {
                '@theme': fileURLToPath(new URL('./theme', import.meta.url)),
                '@components': fileURLToPath(new URL('../src/components', import.meta.url))
            }
        },
    }
})


