import core from '../core/core.js'

export type BotEmojiName = "logo" | "logo_text" | "bell" | "calendar" | "chat" | "dashboard" | "down" | "eye"
    | "fail" | "globe" | "help" | "info" | "left" | "link" | "list" | "lock" | "premium" | "redo" | "right" | "star"
    | "success" | "undo" | "unlocked" | "up" | "user_fail" | "user_success" | "warning";

const generateEmojiNamesType = false // generates above ^

export default async () => {
    // Fetch App Emojis:
    const fetch = await core.botClient.application.emojis.fetch();
    const botEmojis: { [emojiName: string]: string } = {};
    let nameType = '';
    // Map Emojis:
    for (const [id, data] of fetch) {
        botEmojis[data.name] = id;
        // If Generating Emoji Names Type:
        if (generateEmojiNamesType) { nameType += `"${data.name}" | ` }
    }
    nameType = nameType.slice(0, nameType.length - 3) + ';'
    if (generateEmojiNamesType) {
        console.info(`---\nGenerated Emoji Names Type:\n---\n${nameType}\n---`)
    }

    // Assign to core:
    return core.emojis.ids = botEmojis as any;
}