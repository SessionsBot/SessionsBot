// Result Class
export class SuccessResult<dataType> {
    /**  Weather the request was successful or not. */
    public success: true ;
    /** The resulting data returned from the request. */
    public data: dataType ;
        
    constructor(data:dataType){
        this.success = true ;
        this.data = data ;
    }
}

export class ErrorResult {
    /**  Weather the request was successful or not. */
    public success: false

    /** Stringed message for related error. */
    public message: string

    /** Raw js/node error or throw that triggered this failure.*/
    public rawError: Error|Object

    constructor(message:string, rawError?:Error|Object){
        this.message = message
        this.rawError = rawError || undefined
    }
}


export class BasicResult<t> {
    public success: boolean
    public data: t
    constructor(success:boolean, data:t) {
            this.success = success
            this.data = data
    }
}