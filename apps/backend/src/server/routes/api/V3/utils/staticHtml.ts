import { DateTime } from "luxon";
import core from "../../../../../utils/core/core";
import { URLS } from "apps/backend/src/utils/core/urls";


export const rootDomainHtml = () => {

    const c = core;

    return `
    <!DOCTYPE html>
    <html>
    <head>
        <meta http-equiv="refresh" content="10;url=${URLS.site_links.dashboard}" />
        <title>Sessions Bot - API</title>
        <style>
            body {
                background: #18181b;
                color: #fafafa;
                font-family: sans-serif;
                text-align: center;
                padding-top: 50px;
            }

            #logo {
                width: 50px;
                height: 50px;
                border-radius: 7px;
            }
        </style>
    </head>
    <body>
        <img id="logo" src='https://sessionsbot.fyi/logo-text.png'>
        <h1> Sessions Bot - API </h1>
        <p> Redirecting to website in 10 seconds...</p>
        ---
        <p> API Version: 3 </p>
        <p> Current Version: ${c.botVersion} </p>
        <p> Current Commit SHA: ${process.env?.['KOYEB_GIT_SHA']?.slice(0, 7) ?? 'unknown'} </p>
        <p> Server Boot Timestamp: ${DateTime.fromSeconds(c.serverStartedAtTimestamp)?.setZone('America/Chicago')?.toFormat(`F '- CST'`) ?? 'UNKNOWN?'} </p>
        <p> Client Boot Timestamp: ${DateTime.fromMillis(c.botClient.readyTimestamp)?.setZone('America/Chicago')?.toFormat(`F '- CST'`) ?? 'UNKNOWN?'} </p>
        <a href="https://status.sessionsbot.fyi"> Status Page </a>
    </body>
    </html>
    `

}