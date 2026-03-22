import { PermissionFlagsBits, PermissionsString } from "discord.js"

/** Full array of every Permission Flag Bit/BigInt that must be granted to SessionsBot within guilds/channels. */
export const requiredBotPermsInts = [
    PermissionFlagsBits.AttachFiles,
    PermissionFlagsBits.CreateEvents,
    PermissionFlagsBits.CreatePrivateThreads,
    PermissionFlagsBits.CreatePublicThreads,
    PermissionFlagsBits.EmbedLinks,
    PermissionFlagsBits.ManageEvents,
    PermissionFlagsBits.ManageChannels,
    PermissionFlagsBits.ManageMessages,
    PermissionFlagsBits.ManageThreads,
    PermissionFlagsBits.MentionEveryone,
    PermissionFlagsBits.ReadMessageHistory,
    PermissionFlagsBits.SendMessages,
    PermissionFlagsBits.SendMessagesInThreads,
    PermissionFlagsBits.ViewChannel
] as const;


/** Full array of every permission string that must be granted to SessionsBot within guilds/channels. */
export const requiredBotPermsStrings: PermissionsString[] = [
    "AttachFiles", "CreateEvents", "CreatePrivateThreads", "CreatePublicThreads", "EmbedLinks", "ManageEvents",
    "ManageChannels", "ManageMessages", "ManageThreads", "MentionEveryone", "ReadMessageHistory",
    "SendMessages", "SendMessagesInThreads", "ViewChannel"
] as const
