import axios from 'axios';
import express from 'express';
import { APIResponse as Reply } from '../responseClass';
import { useLogger } from '../../../../../utils/logs/logtail';

const createLog = useLogger();

const systemRouter = express.Router({ mergeParams: true })


// Get - System Status(es):
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
        return new Reply(res).failure(`Failed to fetch system statuses`, 500);
    }
})


export default systemRouter;