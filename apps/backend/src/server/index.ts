import express, { json } from "express";
import core from "../utils/core.js";
import corsMiddleware from "./middleware/cors.js";
import rateLimiter from "./middleware/rateLimiter.js";
import apiRouter from "./routes/api/V3/index.js";
import { APIResponse } from "@sessionsbot/shared";
import { ENVIRONMENT_TYPE } from "../utils/environment.js";

/** Main backend web server instance for Sessions Bot. */
const app = express()
const PORT = process.env.PORT || 3000;

// Server setup:
app.use(express.json()); // auto parse json
app.set('trust proxy', 2); // trust true origin IP (2 - for cloudflare)
app.use(corsMiddleware); // use cors middleware
app.use(rateLimiter); // use rate limiter guard

// ROOT / Top Level Routes:
app.use('/api', apiRouter)

// Start Web Server:
app.listen(PORT, () => {
    console.info(`[🌐] Web Server is running on ${PORT}`);
    if (ENVIRONMENT_TYPE == 'development') console.info(`[🌐] Visit at http://localhost:${PORT}`);
})

// 404 - Not Found / Unknown Routes:
app.use((req, res) => {
    // Return not found - as response:
    return new APIResponse(res).failure({
        message: 'NOT FOUND',
        server_version: core.botVersion,
        api_version: 3,
        git_commit_sha: process.env?.['KOYEB_GIT_SHA']?.slice(0, 7)
    }, 404);
    // return res.redirect(core.urls.mainSite + '/api-not-found')
});
