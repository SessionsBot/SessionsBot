/** `ERR DETAILS` - Data Types */
type ErrDetails = {
    message: string
    urgency: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL"
    raw?: any
} & { [key: string]: string }


/** **Response Util** - `RESULT` - Generic Response Tool
 * @usage use `ok` & `err` to send back resulted responses. 
 * @util use `is` for checking if an `unknown` object is a `Result` type.*/
export class Result {
    static ok<d, e>(data: d, extra?: e) {
        if (extra) return {
            success: true as const,
            data,
            extra
        }
        else return {
            success: true as const,
            data
        }

    }

    static err<e, d>(error: e, details?: d | ErrDetails) {
        if (details) return {
            success: false as const,
            error,
            details
        }
        else return {
            success: false as const,
            error
        }

    }

    static isResult(value: unknown) {
        return (
            typeof value == 'object'
            && value !== null
            && 'success' in value
            && ('data' in value || 'error' in value)
        )

    }
}

