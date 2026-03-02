import type { NextFunction, Request, Response } from "express";
import { supabase } from "../../utils/database/supabase.js";
import { APIResponse as reply } from "../routes/api/V3/utils/responseClass.js";
import { AppUser, Database } from "@sessionsbot/shared";
import { HttpStatusCode } from "axios";
import { useLogger } from "../../utils/logs/logtail.js";

const createLog = useLogger();

export interface authorizedRequest extends Request {
    auth: {
        user: AppUser,
        profile: Database['public']['Tables']['profiles']['Row']
    }
}


const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from auth headers:
        const authToken = req.headers?.authorization?.split(' ')?.[1];
        if (!authToken) return new reply(res).failure('Authorization token was not provided!', HttpStatusCode.Unauthorized)
        // Fetch auth user from token:
        const { data: { user: authUser }, error: fetchUserErr } = await supabase.auth.getUser(authToken);
        // If Auth Errored:
        if (fetchUserErr) {
            if (fetchUserErr.code == "bad_jwt") return new reply(res).failure('Invalid Auth Token!', HttpStatusCode.Unauthorized);
            else {
                // Log & Return Failure:
                createLog.for('Api').warn('🔑 - Auth Token Verification Failure - See Details..', { err: fetchUserErr });
                return new reply(res).failure('An error occurred while verifying/fetching user auth token.', 500)
            }
        }
        if (!authUser) return new reply(res).failure('Failed to fetch user!', HttpStatusCode.InternalServerError);
        // Found User via Token - Get Profile:
        const { data: userProfile, error: fetchProfileErr } = await supabase.from('profiles').select('*').eq('id', authUser?.id).maybeSingle()
        if (fetchProfileErr) {
            // Log & Return Error:
            createLog.for('Api').warn('🔑 - Token Verification - Profile Fetch Error - See Details..', { err: fetchProfileErr });
            return new reply(res).failure('Failed to fetch user profile during token validation!', HttpStatusCode.Unauthorized);
        }
        if (!userProfile) return new reply(res).failure('Failed to fetch user profile during token validation!', HttpStatusCode.Unauthorized);
        // Attach authorized user to req:
        req['auth'] = {
            user: authUser,
            profile: userProfile
        } as any;
        // Allow request:
        return next()

    } catch (err) {
        // Log and return error:
        createLog.for('Api').warn('🔑 - Auth Token Verification Failure - See Details..', { err });
        return new reply(res).failure('An error occurred while verifying user auth token.', 500)
    }
}

export default verifyToken;