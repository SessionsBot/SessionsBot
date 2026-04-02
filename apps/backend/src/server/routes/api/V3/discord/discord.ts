import { HttpStatusCode } from 'axios';
import express from 'express';
import { API_DiscordGuildIdentity, API_DiscordSelfIdentity, API_DiscordUserIdentity, discordSnowflakeSchema } from '@sessionsbot/shared'
import { APIResponse as Reply } from '../utils/responseClass';
import { useLogger } from '../../../../../utils/logs/logtail';
import core from '../../../../../utils/core/core';
import z from 'zod';
import verifyToken from 'apps/backend/src/server/middleware/verifyToken';
import { supabase } from 'apps/backend/src/utils/database/supabase';
import { fetchUserDiscordData } from '../auth/authUtils';
import { AuthError } from '../auth/authErrTypes';
import { LRUCache } from 'lru-cache'

const createLog = useLogger();
const discordRouter = express.Router({ mergeParams: true })

// GET - Discord User Identity - From User Id:
discordRouter.get(`/identity/user/:userId`, async (req, res) => {
    try {
        const { botClient: bot } = core

        // Validate UserId:
        if (!req.params.userId) return new Reply(res).failure('Invalid Input - Missing "userId" to fetch identity for!', HttpStatusCode.BadRequest);
        const { data: userId, success: userIdValid, error: userIdError } = z.safeParse(discordSnowflakeSchema, req.params.userId);
        if (!userIdValid) return new Reply(res).failure({ message: 'Discord User ID is invalid!', input_errors: z.treeifyError(userIdError)?.errors }, HttpStatusCode.BadRequest);

        // Get User Data from Id:
        const user =
            bot.users.cache.get(userId) ??
            await bot.users.fetch(userId)
        if (!user) return new Reply(res).failure(`Not Found - No user with provided id(${userId}) could be found within app's scope!`, HttpStatusCode.NotFound);

        // Return FILTERED User Data:
        const userIdentity: API_DiscordUserIdentity = {
            username: user?.username,
            displayName: user?.displayName,
            avatarUrl: user?.avatarURL({ size: 256 }),
            bot: user?.bot,
        }
        return new Reply(res).success(userIdentity)
    } catch (error) {
        // Return Failure:
        createLog.for('Api').warn(`Failed to fetch Discord User Identity!`, { error })
        return new Reply(res).failure(`Error Occurred - Failed to fetch user's Discord identity!`);
    }
})

// GET - Discord SELF User Identity - From TOKEN:
const selfIdentity_Cache = new LRUCache<string, API_DiscordSelfIdentity>({
    max: 250, // 250 users
    ttl: (2 * 60 * 1000) // 2 mins
})
discordRouter.get(`/identity/user/@me`, verifyToken, async (req, res) => {
    try {
        const userId = req?.auth?.profile?.discord_id
        if (!userId) return new Reply(res).failure('Invalid Input - Missing "userId" to fetch identity for!', HttpStatusCode.BadRequest);

        // Check Cache:
        const cachedIdentify = selfIdentity_Cache?.get(userId)
        if (cachedIdentify) {
            // Return cached identity:
            return new Reply(res).success({
                ...cachedIdentify,
                _cache: true
            })
        }

        // Get Access Token for User:
        const { data, error } = await supabase.from('profiles').select('discord_access_token')
            .eq('id', req?.auth?.user?.id)
            .single()
        if (error) throw error
        if (!data) throw 'Data returned null'

        // Fetch Discord User Data - w/ Discord User Token:
        const userData = await fetchUserDiscordData(data.discord_access_token)
        if (userData instanceof AuthError) {
            // Log & Return Failure:
            createLog.for('Api').error('Failed to get a SELF Discord Identity! - See Details!', { userId: req?.auth?.profile?.discord_id, err: userData })
            return new Reply(res).failure({
                message: userData?.message,
                errType: userData?.errorType
            })
        }

        // User Identity - FILTERED User Data:
        const userIdentity: API_DiscordSelfIdentity = {
            id: userData?.user?.id,
            username: userData?.user?.username,
            email: userData?.user?.email,
            display_name: userData?.user?.display_name,
            avatar: userData?.user?.avatar,
            guilds: userData?.guilds
        }

        // Save to cache
        selfIdentity_Cache.set(userId, userIdentity)

        // Detect Changes to Profile's Manageable Guilds:
        const onFile = req?.auth?.profile?.manageable_guild_ids || []
        const fresh = userData?.guilds?.manageable?.map(g => g?.id) || []
        const hasChanges = () => {
            if (onFile.length != fresh.length) return true;
            // Save has extra (now un-manageable) ids:
            const extraIds = onFile.filter(id => !fresh.includes(id))
            if (extraIds?.length) return true
            // Save is missing (newly manageable) ids:
            const missingIds = fresh.filter(id => !onFile.includes(id))
            if (missingIds?.length) return true
            // ALSO: Check for username / email changes:
            if (
                userData?.user?.username != req?.auth?.profile?.username
                || userData?.user?.email != req?.auth?.profile?.email
            ) return true;
            return false // no changes - no db update(s)
        }

        // SYNCHRONOUSLY - Update User Profile - IF CHANGES from current db save:
        if (hasChanges()) {
            void supabase.from('profiles').update({
                username: userData?.user?.username,
                email: userData?.user?.email,
                manageable_guild_ids: userData?.guilds?.manageable?.map(g => g?.id) || []
            })
                .eq('id', req?.auth?.profile?.id)
                .then(({ error: updateERR }) => {
                    // Error Updating Profile:
                    if (updateERR) createLog.for('Api').error(`[SELF IDENTITY]: Failed to update user profile!`, { userId: req?.auth?.profile?.discord_id, error: updateERR })
                })
        }

        // Return "Fresh" User Identity:
        return new Reply(res).success(userIdentity)

    } catch (error) {
        // Return Failure:
        createLog.for('Api').warn(`Failed to fetch Discord SELF User Identity!`, { error })
        return new Reply(res).failure(`Error Occurred - Failed to fetch self user's Discord identity!`);
    }
})


// GET - Discord Guild Identity - From User Id:
discordRouter.get(`/identity/guild/:guildId`, async (req, res) => {
    try {
        const { botClient: bot } = core

        // Validate GuildId:
        if (!req.params.guildId) return new Reply(res).failure('Invalid Input - Missing "guildId" to fetch identity for!', HttpStatusCode.BadRequest);
        const { data: guildId, success: guildIdValid, error: guildIdError } = z.safeParse(discordSnowflakeSchema, req.params.guildId);
        if (!guildIdValid) return new Reply(res).failure({ message: 'Discord Guild ID is invalid!', input_errors: z.treeifyError(guildIdError)?.errors }, HttpStatusCode.BadRequest);

        // Get Guild Data from Id:
        const guild =
            bot.guilds.cache.get(guildId) ??
            await bot.guilds.fetch(guildId)
        if (!guild) return new Reply(res).failure(`Not Found - No guild with provided id(${guildId}) could be found within app's scope!`, HttpStatusCode.NotFound);

        // Return FILTERED Guild Data:
        const guildIdentity: API_DiscordGuildIdentity = {
            name: guild?.name,
            iconUrl: guild?.iconURL({ size: 256 }),
            bannerUrl: guild?.bannerURL({ size: 256 }),
        }
        return new Reply(res).success(guildIdentity)

    } catch (error) {
        // Return Failure:
        createLog.for('Api').warn(`Failed to fetch Discord Guild Identity!`, { error })
        return new Reply(res).failure(`Error Occurred - Failed to fetch guild's Discord identity!`);
    }
})


// Export Router:
export default discordRouter