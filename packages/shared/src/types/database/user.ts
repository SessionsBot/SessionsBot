import type { User } from '@supabase/supabase-js'

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
    app_metadata: AppUserAppData,
    user_metadata: never
}