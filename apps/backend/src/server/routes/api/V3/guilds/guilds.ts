import express from "express";
import { useLogger } from "../../../../../utils/logs/logtail.js";
import { APIResponse as reply, SubscriptionSKUs } from "@sessionsbot/shared";
import verifyToken, { authorizedRequest } from "../../../../middleware/verifyToken.js";
import { verifyGuildMember } from "../../../../middleware/guildMembership.js";
import core from "../../../../../utils/core/core.js";
import { ChannelType } from "discord.js";
import sessionTemplatesRouter from "./sessions/sessionTemplates.js";
import { requiredBotPermsStrings } from "../../../../../utils/bot/permissions/required.js";
import { getGuildEntitlementsFromId } from "../../../../../utils/bot/entitlements.js";
import guildPreferencesRouter from "./preferences.js";

const guildsRouter = express.Router({ mergeParams: true });
const createLog = useLogger();

// GET/FETCH - Guild Channels:
guildsRouter.get('/:guildId/channels', verifyToken, verifyGuildMember(true), async (req: authorizedRequest, res) => {
    try {
        // Parse req:
        const guildId = req.params['guildId'];
        // Fetch guild channels:
        const guildFetch = await core.botClient.guilds.fetch(String(guildId));
        const channelFetch = await guildFetch.channels.fetch();
        const filteredChannels = channelFetch.filter(ch => (ch.type == ChannelType.GuildText || ch.type == ChannelType.GuildCategory))
        // Return result data:
        let result = {
            sendable: filteredChannels.filter(ch => {
                const perms = ch.permissionsFor(guildFetch.members.me)
                return (ch.isSendable() && perms?.has(requiredBotPermsStrings, true))
            }),
            all: filteredChannels
        }
        return new reply(res).success(result)

    } catch (err) {
        // Log & Return Error:
        createLog.for('Api').warn(`Failed to fetch guild channels!`, { err, actorId: req.auth.user.id });
        return new reply(res).failure(err, 500)
    }
});


// GET/FETCH - Guild Roles:
guildsRouter.get('/:guildId/roles', verifyToken, verifyGuildMember(true), async (req: authorizedRequest, res) => {
    try {
        // Parse req:
        const guildId = req.params['guildId'];
        // Fetch guild roles:
        const guildFetch = await core.botClient.guilds.fetch(String(guildId));
        const guildRoles = await guildFetch.roles.fetch();
        // Return result data:
        return new reply(res).success(guildRoles)
    } catch (err) {
        // Log & Return Error:
        createLog.for('Api').warn(`Failed to fetch guild roles!`, { err, actorId: req.auth.user.id });
        return new reply(res).failure(err, 500)
    }
});


// GET/FETCH - Guild Subscription:
guildsRouter.get('/:guildId/subscription', verifyToken, verifyGuildMember(true), async (req: authorizedRequest, res) => {
    try {
        // Parse req:
        const guildId = req.params['guildId'];

        // Fetch Guild Entitlements from Id:
        const entitlements = await getGuildEntitlementsFromId(String(guildId))
        if (!entitlements.success) { throw entitlements };

        // Determine Plan from Entitlements:
        const subscriptionLevel = () => {
            const ownedSKUs = entitlements.entitlements?.map(e => e.sku_id)
            if (ownedSKUs?.includes(SubscriptionSKUs.ENTERPRISE)) return 'ENTERPRISE';
            else if (ownedSKUs?.includes(SubscriptionSKUs.PREMIUM)) return 'PREMIUM';
            else return 'FREE';
        }

        // Return result data:
        return new reply(res).success({ plan: subscriptionLevel(), entitlements: entitlements?.entitlements })
    } catch (err) {
        // Log & Return Error:
        createLog.for('Api').warn(`Failed to fetch guild subscription!`, { err, actorId: req.auth.user.id });
        return new reply(res).failure(err, 500)
    }
})


// Session Template - Endpoints:
guildsRouter.use(`/:guildId/sessions/templates`, sessionTemplatesRouter);
guildsRouter.use('/:guildId/preferences', guildPreferencesRouter)


// Export Router:
export default guildsRouter;