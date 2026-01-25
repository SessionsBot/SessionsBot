import core from '../core.js'

export type BotEmojiName = "sessions" | "sessionsWText"

export default async () => {
    // Fetch App Emojis:
    const fetch = await core.botClient.application.emojis.fetch();
    const botEmojis: { [emojiName: string]: string } = {};
    // Map Emojis:
    for (const [id, data] of fetch) {
        botEmojis[data.name] = `<:${data.name}:${id}>`;
    }
    // Assign to core:
    return core.emojiStrings = botEmojis as any;
}