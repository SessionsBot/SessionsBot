/***BASIC & CUSTOMIZABLE* `Result` class to pass back data between functions with types. */
export class Result<ty> {

    constructor(custom: ty) {
        return custom
    }

    static success<d, e>(data: d, extra?: e | undefined) {
        return {
            success: true as true,
            data,
            extra
        }
    }

    static failure<err, ext>(error: err, extra?: ext | undefined) {
        return {
            success: false as false,
            error,
            extra
        }
    }
}