import { REST, RESTAPIPartialCurrentUserGuild, RESTGetAPICurrentUserGuildsQuery, RESTGetAPICurrentUserGuildsResult, Routes } from "discord.js";
import 'dotenv/config'
import { supabase } from "../database/supabase";

const rest = new REST({ version: "10" }).setToken(process.env?.['DISCORD_BOT_TOKEN']!);

async function fetchAllGuilds() {
    let allGuilds: RESTAPIPartialCurrentUserGuild[] = [];
    let after: string | undefined = undefined;

    while (true) {
        const query = after
            ? new URLSearchParams(<RESTGetAPICurrentUserGuildsQuery>{
                limit: 200,
                after
            } as any)
            : undefined
        const guilds = await rest.get(Routes.userGuilds(), { query }) as RESTGetAPICurrentUserGuildsResult

        if (!guilds.length) break;

        allGuilds.push(...guilds);

        // Set cursor to last guild ID
        after = guilds[guilds.length - 1].id;

        // Stop if this was the last page
        if (guilds.length < 200) break;
    }

    return allGuilds;
}

(async () => {
    try {
        const guilds = await fetchAllGuilds();
        const botGuildIds = guilds.map(g => g.id);

        // Alert of any guilds missing db rows:
        const { data: getData, count: getCount, error: getErr } = await supabase.from('guilds').select('id', { count: 'exact' })
        if (getErr) {
            console.error(`(!) Failed to get current db guild ids for comparison db sync:`, getErr)
        } else {
            const dbGuildIds = getData?.flatMap(g => g?.id)
            const missingDbRows = botGuildIds?.filter(id => !dbGuildIds?.includes(id))
            const awaitingDeletion = dbGuildIds?.filter(id => !botGuildIds?.includes(id))
            console.info(`---\n(i) — Database Guild Sync Results:\n---`)
            console.log(`Total "Bot Installed" Guilds:`, botGuildIds.length);
            console.log(`Total "Database" Guilds:`, getCount);
            console.info(`- Missing Database Rows: \n${JSON.stringify(missingDbRows || [])}\n---`)
            console.info(`- Awaiting Deletion Rows: \n${JSON.stringify(awaitingDeletion || [])}\n---`)
        }

    } catch (err) {
        console.error("(!) Failed to fetch guilds:", err);
    }
})();
