import { SubscriptionPlan } from './guildDoc.js'

/** User data signed/nested within JWT Auth token. */
export type AuthedUser = {
    /** Discord user id of authed user. */
    id: string,
    /** Discord username of authed user. */
    username: string,
    /** Discord email of authed user. */
    email:string,
    /** Discord accent color of authed user. */
    accentColor:string,
    /** Discord display/global name of authed user. */
    displayName: string,
    /** Discord icon url of authed user (or default). */
    iconUrl: string,
    /** Map of all and manageable guilds this user is a member of. */
    guilds : UserGuilds
}

/** Map of authed users current Discord guilds. */
export type UserGuilds = {
    /** Object contain all Discord Guilds this user is a member within. */
    all: {[guildId: string]: UserGuildData},
    /** Object contain manageable Discord Guilds this user is a member within.
     *- `ADMINISTRATOR` or `MANAGE SERVER` permissions required
     */
    manageable: {[guildId: string]: UserGuildData}
}

/** Info for a particular authed user's joined guild. */
export type UserGuildData = {
    /** Name of Discord Guild. */
    name: string,
    /** Name of Discord Guild. */
    iconUrl: string,
    /** If Sessions Bot is a member of this Discord Guild. */
    hasSessionsBot: boolean
    /** If the authed user is the owner of this Discord Guild. */
    isGuildOwner: boolean
    /** The subscription plan of this Discord Guild. (if any) */
    subscriptionPlan: SubscriptionPlan
}