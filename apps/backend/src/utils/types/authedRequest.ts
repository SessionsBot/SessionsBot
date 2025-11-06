import { Request } from "express";
import { AuthedUser } from "@sessionsbot/shared";

export interface AuthedRequest extends Request {
    /** ### 👤 The acting user data from this API request.
     * 
     * > **NOTE:** This is only provided if *`verifyToken()`* is called before req execution..
     */
    user: AuthedUser
}