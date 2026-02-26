import express, { json } from "express";
import core from "../utils/core/core.js";
import corsMiddleware from "./middleware/cors.js";
import rateLimiter from "./middleware/rateLimiter.js";
import apiRouter from "./routes/api/V3/index.js";
import { APIResponse } from "./routes/api/V3/utils/responseClass.js";
import { ENVIRONMENT_TYPE } from "../utils/environment.js";
import { rootDomainHtml } from "./routes/api/V3/utils/staticHtml.js";

/** Main backend web server instance for Sessions Bot. */
const app = express()
const PORT = process.env.PORT || 3000;

// Server setup:
app.use(express.json()); // auto parse json
app.set('trust proxy', true); // see rate limiter
app.use(corsMiddleware); // use cors middleware
app.use(rateLimiter); // use rate limiter guard

// Domain Root:
app.use('/', (req, res) => {
    return res.status(200).send(rootDomainHtml);
})

// Api Root
app.use('/api', apiRouter)


// 404 - Not Found / Unknown Routes:
app.use((req, res) => {
    // Return not found - as response:
    return new APIResponse(res).failure({
        message: 'NOT FOUND',
        server_version: core.botVersion,
        api_version: 3,
        git_commit_sha: process.env?.['KOYEB_GIT_SHA']?.slice(0, 7)
    }, 404);
    // return res.redirect(URLS.website + '/api-not-found')
});


// Start Web Server:
app.listen(PORT, () => {
    console.info(`[🌐] Web Server is running on ${PORT}`);
    if (ENVIRONMENT_TYPE == 'development') console.info(`[🌐] Visit at http://localhost:${PORT}`);
})