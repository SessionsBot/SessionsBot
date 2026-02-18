import axios from "axios";

/** When enabled, routes all API traffic to local dev url at `http://localhost:3000/api` */
const local_dev_api = false;
if (local_dev_api) console.warn(`[🌐] LOCAL API CALLS ARE ENABLED - This is only intended for development purposes!`);

export const apiUrl = local_dev_api ? `http://localhost:3000/api` : `https://basic-meadowlark-sessions-bot-0e63c45d.koyeb.app/api`;

export const API = axios.create({
    baseURL: apiUrl,
    validateStatus: (s) => {
        return true;
    },
    timeout: 10_000,
    timeoutErrorMessage: 'TIMED OUT! - Failed to receive a backend API response within 10 seconds! You might want to check out our status page at https://status.sessionsbot.fyi.',
})
