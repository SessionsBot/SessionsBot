import express, { json } from "express";
import core from "../utils/core.js";
import corsMiddleware from "./middleware/cors.js";
import rateLimiter from "./middleware/rateLimiter.js";
import apiRouter from "./routes/api/V3/index.js";

/** Main backend web server instance for Sessions Bot. */
const app = express()
const PORT = process.env.PORT || 3000;

// Server setup:
app.use(express.json()); // auto parse json
app.set('trust proxy', 2); // trust true origin IP (2 - for cloudflare)
app.use(corsMiddleware); // use cors middleware
app.use(rateLimiter); // use rate limiter guard

app.use((req, res, next) => {
    console.log("req.ip:", req.ip, "| x-forwarded-for:", req.headers["x-forwarded-for"]);
    next();
});

// ROOT / backend web service -> frontend
app.all('/', (async (req, res) => {
    res.redirect(core.urls.mainSite);
}))

// ROOT / Top Level Routes:
app.use('/api', apiRouter)

// Start Web Server:
app.listen(PORT, () => {
    console.info(`[🌐] Web Server is running on ${PORT}`);
    if (process.env['ENVIRONMENT'] == 'development') console.info(`[🌐] Visit at http://localhost:${PORT}`);
})

// 404 - Not Found / Unknown Routes:
app.use((req, res) => {
    return res.redirect(core.urls.mainSite + '/api-not-found')
});
