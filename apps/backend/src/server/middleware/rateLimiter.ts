import rateLimit from "express-rate-limit";

/** GLOBAL Backend Web Server/API Rate Limiter */
export default rateLimit({
    standardHeaders: 'draft-6',
    windowMs: (1000 * 60 * 2), // 2 min time frame
    limit: 77, // 77 requests allowed
    keyGenerator: (req) => {
        const cfIp = req.headers['cf-connecting-ip'];
        if (typeof cfIp === 'string' && cfIp?.length > 0) {
            return cfIp;
        }
        return req.ip;
    },
    handler: (req, res) => {
        res.status(429).json({
            success: false,
            error: "TOO_MANY_REQUESTS",
            message: "Too many requests! Please slow down and try again later.",
            timestamp: new Date().toISOString(),
            path: req.originalUrl,
        });
    }
})