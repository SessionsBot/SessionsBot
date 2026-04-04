import axios from 'axios';
import express from 'express';
import { APIResponse as Reply } from '../utils/responseClass';
import { useLogger } from '../../../../../utils/logs/logtail';
import core from '../../../../../utils/core/core';
import { ENVIRONMENT_GIT_COMMIT_SHA, ENVIRONMENT_TYPE } from '../../../../../utils/environment';
import verifyToken from '../../../../middleware/verifyToken';
import { verifyBotAdmin } from '../../../../middleware/verifyBotAdmin';
import { DateTime } from 'luxon';
import { URLS } from '../../../../../utils/core/urls';



const createLog = useLogger();

const systemRouter = express.Router({ mergeParams: true })


// Get - System Status(es):
// URL: https://api.sessionsbot.fyi/system/status
systemRouter.all('/status', async (req, res) => {
    try {
        // Get system statuses from BetterStack monitors:
        const betterStackKey = process.env?.BETTERSTACK_UPTIME_KEY;
        const statusPageId = `224053`;
        const { data } = await axios.get(`https://uptime.betterstack.com/api/v2/status-pages/${statusPageId}/resources`, { headers: { Authorization: `Bearer ${betterStackKey}` } })

        const monitors: any[] = data.data;

        // Map by up and down services:
        let up = [];
        let down = [];
        const mapMonitor = (m: any) => {
            return {
                id: m?.id,
                name: m?.attributes?.public_name,
                description: m?.attributes?.explanation,
                availability: m?.attributes?.availability,
                status: m?.attributes?.status
            }
        };
        for (const m of monitors) {
            const status = m?.attributes?.status
            if (status == "not_monitored") continue
            if (status != 'operational')
                down.push(mapMonitor(m));
            else
                up.push(mapMonitor(m));
        }

        const showStatusAlert = ((down?.length || 0) >= 1);

        // Return Results:
        return new Reply(res).success({ up, down, showStatusAlert });

    } catch (err) {
        // Return failure:
        createLog.for('Api').warn('Failed to fetch system statuses!', { err });
        return new Reply(res).failure(`Failed to fetch system statuses - Internal Error!`, 500);
    }
})


// BOT System Endpoint Root - BOT Data
// URL: https://api.sessionsbot.fyi/system/bot
systemRouter.all('/bot', verifyToken, verifyBotAdmin, async (req, res) => {

    const bot = core.botClient;
    if (!bot) return new Reply(res).failure('Bot client unavailable!');

    const guildsCount = (await bot.guilds.fetch())?.size ?? 'UNKNOWN'

    return new Reply(res).success({
        current_guilds: guildsCount,
        uptime: bot.uptime,
        ping: bot.ws.ping
    })

})


// System Endpoint Root - System Data
// URL: https://api.sessionsbot.fyi/system/
systemRouter.all('/', (req, res) => {
    return new Reply(res).success({
        env_type: ENVIRONMENT_TYPE,
        commit_sha: ENVIRONMENT_GIT_COMMIT_SHA?.slice(0, 7),
        server_started_at: core.serverStartedAtTimestamp != null
            ? DateTime.fromSeconds(core.serverStartedAtTimestamp)
                ?.setZone('America/Chicago')
                ?.toFormat(`F '- CST'`)
            ?? 'UNKNOWN'
            : 'UNKNOWN',
        client_ready_at: DateTime.fromMillis(core.botClient.readyTimestamp)
            ?.setZone('America/Chicago')
            ?.toFormat(`F '- CST'`)
            ?? 'UNKNOWN',
        status: URLS.status_page
    })
})


export default systemRouter;