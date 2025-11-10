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
app.set('trust proxy', true); // allow true origin (bypass cloud flare stuff)
app.use(corsMiddleware); // use cors middleware
app.use(rateLimiter); // use rate limiter guard\

// ROOT / api/backend -> frontend
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
