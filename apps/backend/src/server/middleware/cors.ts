import cors, {CorsOptions} from "cors"

const allowedOrigins = [
    'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app',
    'https://sessionsbot.fyi',
    'https://www.sessionsbot.fyi',
]

if(process.env?.['ENVIRONMENT'] == 'development') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:5173')
}

const options:CorsOptions = {
    origin(requestOrigin, callback) {
        if(!requestOrigin) callback(null, true);
        else callback(new Error(`CORS - Origin not allowed! - Origin:${requestOrigin}`))
    },
    credentials: true,
}

export default cors()