import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vitepress'
import tailwindcss from '@tailwindcss/vite'

// https://vitepress.dev/reference/site-config
export default defineConfig({
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
                collapsed: true,
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
                        text: 'Sessions', base: '/sessions', target: '/sessions', items: [
                            {
                                text: 'Creating Sessions', link: '#schedules'
                            },
                            {
                                text: 'Session Options', link: '#options'
                            },
                            {
                                text: 'RSVP System', link: '#rsvps'
                            }
                        ]
                    },
                    { text: 'Preferences', link: '/preferences' },

                ],
            }
        ],

        socialLinks: [
            { icon: 'discord', link: 'https://discord.gg/mMqpJEDy9u' },
            { icon: 'github', link: 'https://github.com/SessionsBot/SessionsBot' }
        ],

        footer: {
            copyright: `© ${new Date().getFullYear()} - Sessions Bot <br> <a href="https://sessionsbot.fyi/support" target="_blank" class="text-xs no-underline! hover:underline! opacity-80 hover:opacity-100 transition-all">Need Help?</a>`,
            message: 'Thanks for using Sessions Bot!'
        },

        search: {
            provider: 'local'
        },

        externalLinkIcon: true,

        editLink: {
            text: 'Suggest an Edit',
            pattern(p) {
                return `https://github.com/SessionsBot/SessionsBot/edit/main/apps/docs/src/${p?.relativePath}`
            },
        },

        lastUpdated: {
            formatOptions: {
                dateStyle: 'short',
            },
            text: 'Last Updated'
        },

        outline: {
            level: 'deep',
        },
    },

    srcDir: "src",
    outDir: 'dist',
    cleanUrls: true,



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
        }
    }


})


