import { useAuthStore } from "@/stores/auth";
import type { APIResponseValue } from "@sessionsbot/shared";
import axios from "axios";

export const apiUrl = `https://basic-meadowlark-sessions-bot-0e63c45d.koyeb.app/api`;

export const API = axios.create({
    baseURL: apiUrl,
    validateStatus: (s) => {
        return true
    }
})
