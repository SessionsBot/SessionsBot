import { NextFunction, Request, Response } from "express";
import { supabase } from "../../utils/database/supabase.js";
import { APIResponse as reply } from "../utils/responder.js";
import { HttpStatusCode } from "axios";
import logtail from "../../utils/logs/logtail.js";
import { User } from "@supabase/supabase-js";

export interface authorizedRequest extends Request {
    auth: {
        user: User,
        profile: any
    }
};

const verifyToken = async (req: Request, res: Response, next: NextFunction) => {
    try {
        // Get token from auth headers:
        const authToken = req.headers?.authorization?.split(' ')?.[1];
        // Fetch auth user from token:
        const { data: { user: authUser }, error: fetchUserErr } = await supabase.auth.getUser(authToken);
        if (fetchUserErr || !authUser) return new reply(res).failure('Invalid Auth Token!', HttpStatusCode.Unauthorized);
        // Found User via Token - Get Profile:
        const { data: userProfile, error: fetchProfileErr } = await supabase.from('profiles').select('*').eq('id', authUser.id).maybeSingle()
        if (fetchProfileErr || !userProfile) return new reply(res).failure('Failed to fetch user profile during token validation!', HttpStatusCode.Unauthorized);
        // Attach authorized user to req:
        req['auth'] = {
            user: authUser,
            profile: userProfile
        };
        // Allow request:
        return next()

    } catch (err) {
        // Log and return error:
        logtail.warn('🔑 - Auth Token Verification Failure - See Details..', { err });
        return new reply(res).failure('An error occurred while verifying user auth token.', 500)
    }
}

export default verifyToken;