import type { User } from '@supabase/supabase-js'

export type AppUserGuildData = {
    /** Id of the guild/server. */
    id: string
    /** Name of the guild/server. */
    name: string
    /** Icon image url of the server or default img. */
    icon: string
    /** Permissions BigInt String granted to player within this guild. */
    permissions: string,
    /** Boolean representing if user is the owner of the guild/server. */
    isOwner: boolean,
    /** Number approximation of the members in the guild/server. */
    memberCount: number,
    /** Boolean representing if this guild/server has Sessions Bot. */
    hasSessionsBot: boolean,
}
export type AppUserGuilds = {
    /** Array of all guilds this user is a member within. */
    all: AppUserGuildData[],
    /** Array of guilds this user is an admin member within. 
     * @requires `Manage Server` or `Administrator` permissions.
    */
    manageable: AppUserGuildData[]
}

export type AppUserMetadata = {
    /** The **Discord Id** of the current user. */
    id: string
    /** The username of the current user */
    username: string
    /** The email of the current user. */
    email: string
    /** Display name for the user if set. */
    display_name: string
    /** Avatar/icon image url for the user. */
    avatar: string
    /** */
    guilds: AppUserGuilds
}


type AppRoles = 'user' | 'admin'
export type AppUserAppData = {
    /** APP/SYSTEM wide roles for the user.
     *@example
     roles = ["user","admin"];
     */
    roles: AppRoles[],
    /** Last synced with Discord ISO string date. */
    last_synced: string
}

export interface AppUser extends User {
    user_metadata: AppUserMetadata,
    app_metadata: AppUserAppData,
}