import type { NextFunction, Request, Response } from "express";
import { supabase } from "../../utils/database/supabase.js";
import { APIResponse as reply } from "../routes/api/V3/utils/responseClass.js";
import { HttpStatusCode } from "axios";
import { useLogger } from "../../utils/logs/logtail.js";

const createLog = useLogger();

/** **Used to authenticate a user while making a backend API request**
 * @requires "Bearer (JWT)" Authorization Header w/ `Request`
 */
const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from request auth headers:
        const authToken = req.headers?.authorization?.split(' ')?.[1];
        if (!authToken) return new reply(res).failure('Authorization token was not provided!', HttpStatusCode.Unauthorized)
        // Fetch auth user from token:
        const { data: { user: authUser }, error: fetchUserErr } = await supabase.auth.getUser(authToken);
        // If Auth Errored:
        if (fetchUserErr) {
            if (fetchUserErr.code == "bad_jwt" || fetchUserErr?.name == "AuthSessionMissing") return new reply(res).failure('Invalid/Expired Auth Token!', HttpStatusCode.Forbidden);
            else {
                // Log & Return Failure:
                createLog.for('Api').error('🔑 - Auth Token Verification Failure!', { err: fetchUserErr });
                return new reply(res).failure('An error occurred while verifying/fetching user auth token.', 500)
            }
        }
        if (!authUser) return new reply(res).failure('Failed to fetch user!', HttpStatusCode.InternalServerError);
        // Found User via Token - Get Profile:
        const { data: userProfile, error: fetchProfileErr } = await supabase.from('profiles').select('*').eq('id', authUser?.id).maybeSingle()
        if (fetchProfileErr) {
            // Log & Return Error:
            createLog.for('Api').error('🔑 - Token Verification - Profile Fetch Error!', { err: fetchProfileErr, uid: authUser?.id });
            return new reply(res).failure('Failed to fetch user profile during token validation!', HttpStatusCode.InternalServerError);
        }
        if (!userProfile) return new reply(res).failure('Failed to fetch user profile during token validation!', HttpStatusCode.InternalServerError);
        // Attach authorized user to req:
        req['auth'] = {
            user: authUser,
            profile: userProfile
        } as any;
        // Allow request:
        return next()

    } catch (err) {
        // Log and return error:
        createLog.for('Api').error('🔑 - Auth Token Verification Failure - Caught Error!', { err });
        return new reply(res).failure('An error occurred while verifying user auth token.', 500)
    }
}

export default verifyToken;