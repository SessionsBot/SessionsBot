import { HttpStatusCode } from "axios";

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