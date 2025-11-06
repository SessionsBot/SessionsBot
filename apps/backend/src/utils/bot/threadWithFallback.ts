import { ChannelType, Guild, TextChannel, ThreadChannel, ThreadAutoArchiveDuration, User, GuildTextBasedChannel, Channel, DMChannel } from "discord.js";
import logtail from "../logs/logtail.js";
import core from "../core.js";

export default async (guild:Guild, user:User, attemptFirst:Channel):Promise<ThreadChannel|DMChannel> => {
    const botMember = guild.members.me;
    const botUser = core.botClient.user;

    // --- STEP 1: Resolve the proper base channel ---
    let baseChannel = null;

    if (attemptFirst instanceof ThreadChannel) {
        // If it's a thread, get its parent text channel
        baseChannel = attemptFirst.parent ?? null;
    } else if (attemptFirst?.isTextBased?.()) {
        baseChannel = attemptFirst;
    }

    // --- STEP 2: Verify permissions ---
    if (baseChannel && botMember && baseChannel.isTextBased()) {
        const perms = baseChannel.permissionsFor(botMember);
        if (!perms?.has("ManageThreads") && !perms?.has("CreatePrivateThreads")) {
            baseChannel = null;
        }
    } else {
        baseChannel = null;
    }

    // --- STEP 3: Attempt to create thread in valid channel ---
    if (baseChannel) {
        try {
            const created = await baseChannel.threads.create({
                name: `New Session - @${user.username}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                invitable: false,
                type: ChannelType.PrivateThread,
                reason: "Create a new session (for today) through provided questions/inputs.",
            });

            await created.members.add(botUser.id);
            await created.members.add(user.id);
            return created;
        } catch (e) {
            logtail.warn("Failed to create thread in priority channel", { error: e });
        }
    }

    // --- STEP 4: Fallback: Try other text channels ---
    const channels = await guild.channels.fetch();
    for (const [, channel] of channels) {
        if (channel.type !== ChannelType.GuildText) continue;
        const perms = channel.permissionsFor(botMember);
        if (!perms?.has("CreatePrivateThreads")) continue;

        try {
            const created = await channel.threads.create({
                name: `New Session - @${user.username}`,
                autoArchiveDuration: ThreadAutoArchiveDuration.OneHour,
                invitable: false,
                type: ChannelType.PrivateThread,
                reason: "Fallback thread creation for session.",
            });

            await created.members.add(botUser.id);
            await created.members.add(user.id);
            return created;
        } catch (e) {
            // skip failed
        }
    }

    // --- STEP 5: Final fallback - DM user ---
    try {
        const dm = await user.createDM();
        if (dm?.isSendable()) return dm;
    } catch (e) {
        logtail.warn("Failed to create DM fallback", { error: e });
    }

    // --- STEP 6: All failed ---
    logtail.warn(`💬 No valid destination for private thread or DM`, {
        guildId: guild.id,
        user: { id: user.id, username: user.username },
    });
};
