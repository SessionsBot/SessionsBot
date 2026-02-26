// API V3 Sessions Bot - Internal Backend API Endpoints
import express from "express";
import core from "../../../../utils/core/core";

import authRouter from './auth/auth.js'
import guildsRouter from "./guilds/guilds";
import systemRouter from "./system/system";
import discordRouter from "./discord/discord";
import { rootDomainHtml } from "./utils/staticHtml";

// Create Router
const apiRouter = express.Router();

// Fallback route:
apiRouter.all('/', (req, res) => {
    res.send(rootDomainHtml);
})

// Nested Routes:
apiRouter.use('/auth', authRouter);
apiRouter.use('/guilds', guildsRouter);
apiRouter.use('/system', systemRouter);
apiRouter.use('/discord', discordRouter);


// - Export Router:
/** V3 - SessionsBot API Root Routes */
export default apiRouter