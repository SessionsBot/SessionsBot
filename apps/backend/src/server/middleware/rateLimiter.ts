import { APIResponseValue } from "@sessionsbot/shared";
import { HttpStatusCode } from "axios";
import rateLimit, { ipKeyGenerator } from "express-rate-limit";

/** GLOBAL Backend Web Server/API Rate Limiter */
export default rateLimit({
    legacyHeaders: false,
    standardHeaders: 'draft-6',
    windowMs: (1000 * 60), // 1 min time frame
    limit: 50, // 60 requests allowed
    keyGenerator: (req) => ipKeyGenerator(req?.ip),
    handler: (req, res) => {
        const resetTime = req?.['rateLimit']?.resetTime?.getTime() ?? null;
        const retryAfterSeconds = resetTime ? Math.max(
            Math.ceil((resetTime - Date.now()) / 1000),
            0
        ) : null;

        res.status(429).json(<APIResponseValue>{
            success: false,
            data: null,
            error: {
                message: 'Too many requests! Please slow down and try again later.',
                path: req.originalUrl,
                retry_after: retryAfterSeconds
            },
            status: {
                code: HttpStatusCode.TooManyRequests,
                message: 'Too many requests! Please slow down and try again later.'
            }
        });
    },
    skip: (req) => req.method == 'OPTIONS',
})