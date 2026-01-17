import cors, { CorsOptions } from "cors"
import { ENVIRONMENT_TYPE } from "../../utils/environment";

const allowedOrigins = [
    'https://brilliant-austina-sessions-bot-discord-5fa4fab2.koyeb.app',
    'https://sessionsbot.fyi',
    'https://www.sessionsbot.fyi',
]
if (ENVIRONMENT_TYPE != 'production') {
    allowedOrigins.push('http://localhost:3000', 'http://localhost:5173')
}

const options: CorsOptions = {
    origin(requestOrigin, callback) {
        if (!requestOrigin) {
            // Allow requests like Postman or curl (no origin)
            return callback(null, true);
        }
        if (allowedOrigins.includes(requestOrigin)) {
            // Allow whitelisted origins
            return callback(null, true);
        }
        // Block everything else
        return callback(new Error(`CORS - Origin not allowed! Origin: ${requestOrigin}`));
    },
    credentials: true,
}

export default cors()