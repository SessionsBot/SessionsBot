import { AppUser, Database } from "@sessionsbot/shared"
import { request } from "express"

export { }

declare global {

    // Express Types:
    namespace Express {

        interface Request {
            // Authorized User Data - Sometimes Provided:
            auth?: {
                user?: Partial<AppUser>,
                profile?: Partial<Database['public']['Tables']['profiles']['Row']>
            }
        }

    }

}