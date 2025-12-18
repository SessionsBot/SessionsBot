export const AuthErrorTypes = {
    oAuth2: {
        message: "Discord oAuth2 Failed, code not valid or Discord error present.",
        status: 401,
    },
    codeExchange: {
        message: "Failed to exchange Discord auth code for access token.",
        status: 500,
    },
    fetchUser: {
        message: "Failed to fetch user data from Discord API.",
        status: 502,
    },
    missingEmail: {
        message: "Discord user missing verified email address.",
        status: 400,
    },
    createUser: {
        message: "Failed to create new Supabase user.",
        status: 500,
    },
    updateUser: {
        message: "Failed to update existing Supabase user.",
        status: 500,
    },
    generateLink: {
        message: "Failed to generate Supabase magic link.",
        status: 500,
    },
    unknown: {
        message: "An unknown error has occurred please see console/logs.",
        status: 500
    }
}

export class AuthError {
    public readonly errorType: keyof typeof AuthErrorTypes
    public readonly message: string
    public readonly status: number
    public readonly queryPath: string

    constructor(errType: keyof typeof AuthErrorTypes, extra?: any) {
        const { message, status } = AuthErrorTypes[errType]
        this.errorType = errType
        this.message = message
        this.status = status
        this.queryPath = `&errorType=${errType}`
        if (extra) (this as any).extra = extra;
    }
};