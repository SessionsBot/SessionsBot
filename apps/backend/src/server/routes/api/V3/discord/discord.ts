import { HttpStatusCode } from 'axios';
import express from 'express';
import { API_DiscordUserIdentity, discordSnowflakeSchema } from '@sessionsbot/shared'
import { APIResponse as Reply } from '../utils/responseClass';
import { useLogger } from '../../../../../utils/logs/logtail';
import core from '../../../../../utils/core/core';
import z from 'zod';

const createLog = useLogger();
const discordRouter = express.Router({ mergeParams: true })

// GET - Discord Identity - From User Id:
discordRouter.get(`/identity/:userId`, async (req, res) => {
    try {
        const { botClient: bot } = core

        // Validate UserId:
        if (!req.params.userId) return new Reply(res).failure('Invalid Input - Missing "userId" to fetch identity for!', HttpStatusCode.BadRequest);
        const { data: userId, success: userIdValid, error: userIdError } = z.safeParse(discordSnowflakeSchema, req.params.userId);
        if (!userIdValid) return new Reply(res).failure({ message: 'Discord User ID is invalid!', input_errors: z.treeifyError(userIdError)?.errors }, HttpStatusCode.BadRequest);

        // Get User Data from Id:
        const user = await bot.users.fetch(userId)
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
        createLog.for('Api').warn('Failed to fetch Discord Identity! See Details..', { error })
        return new Reply(res).failure(`Error Occurred - Failed to fetch user's Discord identity!`);
    }
})


// Export Router:
export default discordRouter