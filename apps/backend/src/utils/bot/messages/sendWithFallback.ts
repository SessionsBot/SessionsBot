import { ChannelType, ContainerBuilder, MessageFlags } from "discord.js";

import { Result } from "@sessionsbot/shared";
import core from "../../core";
import logtail from "../../logs/logtail";

/** Used to send *"critical"* type messages that deserve to desperately be delivered. Such as permission and setup alerts. */
export default async (guildId: string, messageContent: ContainerBuilder) => {
    try {
        // Fetch guild:
        const guild = await core.botClient.guilds.fetch(guildId);

        // Attempt to send in "System" channel:
        try {
            if (guild.systemChannel && guild.systemChannel.isSendable()) {
                await guild.systemChannel.send({
                    components: [messageContent],
                    flags: MessageFlags.IsComponentsV2
                })
                return Result.success(`Message was sent to system channel!`);
            }
        } catch (err) { }

        // Attempt any other text based channel:
        try {
            const fallbackChannels = guild.channels.cache.filter(channel =>
                channel.type == ChannelType.GuildText &&
                channel.isSendable()
            );

            for (const [, channel] of fallbackChannels) {
                try {
                    await channel.send({
                        components: [messageContent],
                        flags: MessageFlags.IsComponentsV2
                    })
                } catch (e) { continue }
                // If succeeded:
                return Result.success(`Message was sent through a fallback channel! - Id: ${channel?.id}`);
            }
        } catch (err) { }

        // Finally attempt to DM server owner:
        try {
            const guildOwner = await guild.fetchOwner();
            await guildOwner.send({
                components: [messageContent],
                flags: MessageFlags.IsComponentsV2
            })
            // Return success:
            return Result.success(`Message was sent to server owner!`);
        } catch (err) {
            // throw to final err catch
            throw { message: 'ALL SEND ATTEMPTS FAILED!', guildId, sendToOwnerErr: err }
        }

    } catch (err) {
        // Log and return failure:
        logtail.error(`[⚠] - Failed to desperately send a message to guild ${guildId}`, { err });
        return Result.failure('Failed to desperately send message to  guild...', err);
    }
}