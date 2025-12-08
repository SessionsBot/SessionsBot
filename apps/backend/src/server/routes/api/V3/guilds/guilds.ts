import axios from "axios";
import express from "express";
import logtail from "../../../../../utils/logs/logtail.js";
import { APIResponse as reply } from "../../../../utils/responder.js";
import verifyToken, { authorizedRequest } from "../../../../middleware/verifyToken.js";
import { verifyGuildAdmin } from "../../../../middleware/guildMembership.js";
import core from "../../../../../utils/core.js";
import { ChannelType } from "discord.js";

const guildsRouter = express.Router({ mergeParams: true });


// GET/FETCH - Guild Channels:
guildsRouter.get('/:guildId/channels', verifyToken, verifyGuildAdmin, async (req: authorizedRequest, res) => {
    try {
        // Parse req:
        const guildId = req.params['guildId'];
        // Fetch guild channels:
        const guildFetch = await core.botClient.guilds.fetch(guildId);
        const channelFetch = await guildFetch.channels.fetch();
        // Return result data:
        const guildChannels = channelFetch.filter((ch) => (ch.type == ChannelType.GuildText) || (ch.type == ChannelType.GuildCategory));
        return new reply(res).success(guildChannels)

    } catch (err) {
        // Log & Return Error:
        logtail.warn(`[🌐] API REQ - Failed to fetch guild channels!`, { err, actorId: req.auth.user.id });
        return new reply(res).failure(err, 500)
    }
});


// GET/FETCH - Guild Roles:
guildsRouter.get('/:guildId/roles', verifyToken, verifyGuildAdmin, async (req: authorizedRequest, res) => {
    try {
        // Parse req:
        const guildId = req.params['guildId'];
        // Fetch guild roles:
        const guildFetch = await core.botClient.guilds.fetch(guildId);
        const guildRoles = await guildFetch.roles.fetch();
        // Return result data:
        return new reply(res).success(guildRoles)
    } catch (err) {
        // Log & Return Error:
        logtail.warn(`[🌐] API REQ - Failed to fetch guild roles!`, { err, actorId: req.auth.user.id });
        return new reply(res).failure(err, 500)
    }
})


// Export Router:
export default guildsRouter;