import { discordSnowflakeSchema } from '../../zodSchemas/api/discordSnowflakes'
import * as z from 'zod'

// Validate Body
export const API_DataDeletionRequestBodySchema = z.object({
    deleteUserData: z.boolean(),
    deleteGuildData: z.boolean(),
    guildIds: z.nullish(z.array(discordSnowflakeSchema))
})
export type API_DataDeletionRequestBodyInterface = z.infer<typeof API_DataDeletionRequestBodySchema>