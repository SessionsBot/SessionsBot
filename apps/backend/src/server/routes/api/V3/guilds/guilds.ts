import axios from "axios";
import express from "express";
import { useLogger } from "../../../../../utils/logs/logtail.js";
import { APIResponse as reply, SubscriptionPlanName, SubscriptionSKUs } from "@sessionsbot/shared";
import verifyToken, { authorizedRequest } from "../../../../middleware/verifyToken.js";
import { verifyGuildAdmin, verifyGuildMember } from "../../../../middleware/guildMembership.js";
import core from "../../../../../utils/core.js";
import { ChannelType, RESTGetAPIEntitlementsQuery, RESTGetAPIEntitlementsResult, Routes } from "discord.js";
import sessionTemplatesRouter from "./sessions/sessionTemplates.js";
import { requiredBotPermsStrings } from "../../../../../utils/bot/permissions/required.js";

const guildsRouter = express.Router({ mergeParams: true });
const createLog = useLogger();

// GET/FETCH - Guild Channels:
guildsRouter.get('/:guildId/channels', verifyToken, verifyGuildAdmin, async (req: authorizedRequest, res) => {
    try {
        // Parse req:
        const guildId = req.params['guildId'];
        // Fetch guild channels:
        const guildFetch = await core.botClient.guilds.fetch(guildId);
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
        createLog.for('Api').warn(`Failed to fetch guild roles!`, { err, actorId: req.auth.user.id });
        return new reply(res).failure(err, 500)
    }
});


// GET/FETCH - Guild Subscription:
guildsRouter.get('/:guildId/subscription', verifyToken, verifyGuildMember, async (req: authorizedRequest, res) => {
    try {
        // Parse req:
        const guildId = req.params['guildId'];
        const { botClient: bot } = core;

        // Fetch guild entitlements:
        const guildEntitlements: RESTGetAPIEntitlementsResult = await bot.rest.get(Routes.entitlements(bot.application.id), {
            query: new URLSearchParams(<RESTGetAPIEntitlementsQuery>{
                exclude_ended: true,
                guild_id: guildId
            } as any)
        }) as any;

        // Determine Subscription Level:
        const subscriptionLevel = (): SubscriptionPlanName => {
            if (guildEntitlements.some(e => e.sku_id == SubscriptionSKUs.ENTERPRISE)) return 'ENTERPRISE';
            else if (guildEntitlements.some(e => e.sku_id == SubscriptionSKUs.PREMIUM)) return 'PREMIUM';
            else return 'FREE';
        }

        // Return result data:
        return new reply(res).success({ plan: subscriptionLevel(), entitlements: guildEntitlements })
    } catch (err) {
        // Log & Return Error:
        createLog.for('Api').warn(`Failed to fetch guild subscription!`, { err, actorId: req.auth.user.id });
        return new reply(res).failure(err, 500)
    }
})


// Session Template - Endpoints:
guildsRouter.use(`/:guildId/sessions/templates`, sessionTemplatesRouter);


// Export Router:
export default guildsRouter;