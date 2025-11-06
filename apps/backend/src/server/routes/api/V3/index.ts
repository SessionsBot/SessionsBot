// API V3 Sessions Bot - Internal Backend API Endpoints
import express from "express";
import { APIResponse } from "../../../utils/responder";
import { HttpStatusCode } from "axios";

// import authRouter from './auth/index.js'
import authRouter from './auth/auth.js'

// Create Router
const apiRouter = express.Router()

// Nested Routes:
apiRouter.use('/auth', authRouter)


// - Export Router:
/** V3 - SessionsBot API Root Routes */
export default apiRouter