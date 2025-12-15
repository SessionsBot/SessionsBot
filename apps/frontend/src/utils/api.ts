import { useAuthStore } from "@/stores/auth";
import type { APIResponseValue } from "@sessionsbot/shared";
import axios from "axios";

/** When enabled, routes all API traffic to local dev url at `http://localhost:3000/api` */
const local_dev_api = true;

export const apiUrl = local_dev_api ? `http://localhost:3000/api` : `https://basic-meadowlark-sessions-bot-0e63c45d.koyeb.app/api`;

export const API = axios.create({
    baseURL: apiUrl,
    validateStatus: (s) => {
        return true;
    }
})
