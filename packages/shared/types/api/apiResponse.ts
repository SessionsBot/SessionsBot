import { HttpStatusCode } from "axios";
import type { Response } from "express";

/** **INTERNAL**: API Response Schema/Interface  */
export type APIResponseValue<d = unknown, e = unknown> = {
    success: boolean,
    data: d | undefined,
    error: e | undefined,
    status: {
        code: HttpStatusCode | number
        message: string
    }
}


/** **INTERNAL**: API Response Schema/Interface
 * @required
 * @example
 * {
        success: true,
        data: any,
        error: any,
        status: {
            code: statusCode,
            message: HttpStatusCode[statusCode]
        }
    }
 */
export class APIResponse {

    // new APIResponse() constructor
    constructor(private res: Response) {
        this.res = res
    };

    /** Sends back a successful http response with provided inputs. */
    public success<t>(data: t, statusCode = 200) {
        return this.res.status(statusCode).json(<APIResponseValue<typeof data, null>>{
            success: true,
            data,
            error: null,
            status: {
                code: statusCode,
                message: HttpStatusCode[statusCode]
            }
        })
    };


    /** Sends back a failed http response with provided inputs. */
    public async failure<t>(error: t, statusCode: HttpStatusCode = 500, extra?: any) {
        return this.res.status(statusCode).json({
            success: false,
            data: extra || null,
            error,
            status: {
                code: statusCode,
                message: HttpStatusCode[statusCode]
            }
        })
    };

    public sendSuccess = this.success;
    public sendFailure = this.failure;
}