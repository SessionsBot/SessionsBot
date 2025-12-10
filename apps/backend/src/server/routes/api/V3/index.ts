// API V3 Sessions Bot - Internal Backend API Endpoints
import express from "express";
import { APIResponse } from "@sessionsbot/shared";
import { HttpStatusCode } from "axios";
import core from "../../../../utils/core";

import authRouter from './auth/auth.js'
import guildsRouter from "./guilds/guilds";

// Create Router
const apiRouter = express.Router();

// Fallback route:
apiRouter.all('/', (req, res) => {
    res.send({ status: 'operational', release_version: core.botVersion, api_version: 3, git_commit_sha: process.env?.['KOYEB_GIT_SHA']?.slice(0, 7) });
})

// Nested Routes:
apiRouter.use('/auth', authRouter);
apiRouter.use('/guilds', guildsRouter);


// - Export Router:
/** V3 - SessionsBot API Root Routes */
export default apiRouter