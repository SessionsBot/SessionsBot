import rateLimit from "express-rate-limit";

/** GLOBAL Backend Web Server/API Rate Limiter */
export default rateLimit({
    standardHeaders: 'draft-6',
    windowMs: (1000*60*2), // 2 min time frame
    limit: 20, // 20 requests allowed
    message: 'TOO MANY REQUESTS! Please slow down and try again later.',
})