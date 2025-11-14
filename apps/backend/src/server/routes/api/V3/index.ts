// API V3 Sessions Bot - Internal Backend API Endpoints
import express from "express";
import { APIResponse } from "../../../utils/responder";
import { HttpStatusCode } from "axios";

// import authRouter from './auth/index.js'
import authRouter from './auth/auth.js'
import core from "../../../../utils/core";

// Create Router
const apiRouter = express.Router();

// Fallback route:
apiRouter.all('/', (req, res) => {
    res.send({ status: 'operational', release_version: core.botVersion, api_version: 3, git_commit_sha: process.env?.['KOYEB_GIT_SHA']?.slice(0, 8) });
})

// Nested Routes:
apiRouter.use('/auth', authRouter)


// - Export Router:
/** V3 - SessionsBot API Root Routes */
export default apiRouter