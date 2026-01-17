import core from '../core.js'

export default async () => {
    // Fetch App Emojis:
    const fetch = await core.botClient.application.fetchSKUs()

    console.info(fetch)
}