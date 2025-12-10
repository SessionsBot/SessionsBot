import { NextFunction, Request, Response } from 'express';
import jwt from 'jsonwebtoken'
import logtail from '../../utils/logs/logtail.js';
import { AuthedUser, APIResponse } from '@sessionsbot/shared';
import { HttpStatusCode } from 'axios';

const JWT_SECRET = process.env?.['JWT_SECRET'];

/** **🔑 Used to verify a users authentication token!**
 *- `Valid token`: *Allows request*
 *- `Invalid token`: *Returns 429*
 */
export const verifyToken = (req: Request, res: Response, next: NextFunction) => {
    try {
        const authToken = req?.headers?.authorization.split(' ')[1];
        // Attempt to verify/decode token from headers:
        try {
            const decodedUser = jwt.verify(authToken, JWT_SECRET) as AuthedUser;
            // Attach authed user to request:
            req['user'] = decodedUser;
            return next(); // allowed if no err

        } catch (verifyErr) {
            if (verifyErr?.name == 'TokenExpiredError') {
                // Expired token:
                return new APIResponse(res).sendFailure('Invalid Permissions - Your authentication token has expired!', HttpStatusCode.Unauthorized);
            } else if (verifyErr?.name == 'JsonWebTokenError') {
                // Invalid token:
                return new APIResponse(res).sendFailure('Invalid Permissions - Your authentication token is invalid/altered!', HttpStatusCode.BadRequest);
            } else throw verifyErr;
        }

    } catch (err) {
        console.log('FAILED', err);

        // logtail.warn(`[👤] FAILED to verify auth token for API request - See details...`, {err, req});
        return new APIResponse(res).sendFailure('Internal Error - Failed to verify auth token. If this error persists, contact support.');
    }
}