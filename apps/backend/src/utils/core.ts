import { SubscriptionSKUs } from '@sessionsbot/shared';
import pkg from '../../package.json' with { type: 'json' };
import { ExtendedClient } from './types/extendedClient.js';
import { Entitlement, SKU } from 'discord.js';


const core = {
    /** Current running Sessions Bot version. */
    botVersion: pkg.version,
    /** Currently logged in client instance. */
    botClient: <ExtendedClient>null,

    /** Default core colors in default hex format. */
    colors: {
        /** Default core colors in default hex format. */
        plain: {
            success: '#6dc441',
            error: '#d43f37',
            warning: '#fc8c03',
            yellow: '#e3f542',
            blue: '#4287f5',
            purple: '#9b42f5',
            gray: '#585858'
        },
        /** Returns a converted 0x hex color number from a provided core color. */
        getOxColor: (colorName: 'success' | 'error' | 'yellow' | 'warning' | 'blue' | 'purple' | 'gray') => {
            const reqColor = core.colors.plain?.[colorName]
            const convertedColor = Number(reqColor.replace('#', "0x"));
            return convertedColor
        },
    },

    /** Custom emoji strings formatted for use within Discord. 
     * * (loaded by `ready` event) */
    emojiStrings: <{ [emojiName: string]: string }>{
        sessions: ':null:',
        sessionsWText: ':null:'
    },

    /** Holds application/bot command related data. */
    commands: {
        /** Bot application command ids mapped by their command names. */
        ids: <{ [cmdName: string]: string }>{},
        /** Returns a command "link" string for a provided command name or else just the name itself if undefined. */
        getLinkString: (
            /** The * ***exact*** * command name to retrieve a string for. */
            cmdName: string
        ) => {
            const cmdId = core.commands.ids[cmdName] || null;
            if (!cmdId) return '/' + cmdName;
            else return `</${cmdName}:${cmdId}>`
        }
    },

    /** Discord SKU Ids representing different store products for Sessions Bot 
     * * loaded by `ready` event
     * @NOTE Possibly obsolete, see {@link SubscriptionSKUs} */
    storeSKUs: <Record<string, SKU>>{},

    /** Internal / frequent url locations. */
    urls: {
        mainSite: `https://sessionsbot.fyi`,
        pricing: `https://sessionsbot.fyi/pricing`,
        statusPage: `https://status.sessionsbot.fyi`,
        docs: {
            root: `https://docs.sessionsbot.fyi`,
            requiredBotPermissions: `https://docs.sessionsbot.fyi/getting-started#required-bot-permissions`,
            signupChannelsInfo: 'https://docs.sessionsbot.fyi/server-config#signup-channel'
        },
        inviteBot: `https://invite.sessionsbot.fyi`,
        discordServer: 'https://discord.gg/dKp5HZPjCg',
        support: {
            serverInvite: `https://discord.gg/49gNbwA8t6`,
            onlineResources: `https://sessionsbot.fyi/support`
        }
    },


}

export default core;
export const get0xColor = core.colors.getOxColor
export const urls = core.urls
