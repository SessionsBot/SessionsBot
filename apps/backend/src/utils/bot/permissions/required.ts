import { PermissionFlagsBits, PermissionsString } from "discord.js"

/** Full array of every Permission Flag Bit/BigInt that must be granted to SessionsBot within guilds/channels. */
export const requiredBotPermsInts = [
    PermissionFlagsBits.CreatePrivateThreads,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageThreads,
    PermissionFlagsBits.MentionEveryone,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.SendMessagesInThreads,
    PermissionFlagsBits.ViewChannel
] as const;

requiredBotPermsInts.length

/** Full array of every permission string that must be granted to SessionsBot within guilds/channels. */
export const requiredBotPermsStrings: PermissionsString[] = [
    "CreatePrivateThreads", "CreatePublicThreads", "EmbedLinks", "ManageChannels",
    "ManageMessages", "ManageThreads", "MentionEveryone", "ReadMessageHistory",
    "SendMessages", "SendMessagesInThreads", "ViewChannel"
];