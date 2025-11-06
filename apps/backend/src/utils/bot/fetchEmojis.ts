import core from '../core.js'

export default async () => {
    // Fetch App Emojis:
    const fetch = await core.botClient.application.emojis.fetch();
    const botEmojis = {};

    // Map Emojis:
    for(const [id, data] of fetch){
        botEmojis[data.name] = `<:${data.name}:${id}>`;
    }

    // Assign to core:
    core.emojiStrings = botEmojis;
    
}