import { HttpStatusCode } from "axios";
import { Response } from "express";


export class APIResponse {

    // new APIResponse() constructor
    constructor(private res: Response) {
        this.res = res
    }

    /** Sends back a successful http response with provided inputs. */
    public success<t>(data: t, statusCode = 200) {
        return this.res.status(statusCode).json({
            success: true,
            data,
            error: null,
            status: {
                code: statusCode,
                message: HttpStatusCode[statusCode]
            }
        })
    }


    /** Sends back a failed http response with provided inputs. */
    public async failure<t>(error: t, statusCode: HttpStatusCode = 500) {
        return this.res.status(statusCode).json({
            success: false,
            data: null,
            error,
            status: {
                code: statusCode,
                message: HttpStatusCode[statusCode]
            }
        })
    }

    public sendSuccess = this.success;
    public sendFailure = this.failure;
}