/***BASIC & CUSTOMIZABLE* `Result` class to pass back data between functions with types. */
export class Result<ty> {

    constructor(custom: ty) {
        return custom
    }

    static success<d, e>(data: d, extra?: e) {
        return {
            success: true,
            data,
            extra
        }
    }

    static failure<err, ext>(error: err, extra?: ext) {
        return {
            success: false,
            error,
            extra
        }
    }
}