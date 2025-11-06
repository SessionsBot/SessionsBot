import { Response } from "express";

export class APIResponse {

    // new APIResponse() constructor
    constructor(private res:Response){
        this.res = res
    }

    /** Sends back a successful http response with provided inputs. */
    public sendSuccess<t>(data:t, statusCode=200) {
        return this.res.status(statusCode).json({
            success: true,
            data,
            error: null
        })
    }


    /** Sends back a failed http response with provided inputs. */
    public async sendFailure<t>(data:t|{message: string, errorCode:number}, statusCode=500) {
        return this.res.status(statusCode).json({
            success: false,
            data: null,
            error: data
        })
    }
}