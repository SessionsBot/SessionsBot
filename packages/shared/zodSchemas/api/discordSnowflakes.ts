import z from 'zod';

/** `Zod String` schema to safely parse interpreted Discord Snowflake Ids.
 * @includes UserIds, ChannelIds, GuildIds, etc.
 */
export const discordSnowflakeSchema = z.string('Discord ID must be a string')
    .regex(/^\d+$/, 'Discord ID must be numeric')
    .min(17, 'Discord ID is too short')
    .max(21, 'Discord ID is too long')