import { SKUType } from 'discord.js'
import core from '../core/core.js'

export default async () => {
    // Fetch App SKUs:
    const fetch = await core.botClient.application.fetchSKUs();

    // Filter out - "System Groups":
    const filtered = fetch.filter((s) => s.type != SKUType.SubscriptionGroup)

    // Map by Name & SKU Id:
    let mapped: typeof core.storeSKUs = {} as any;
    for (const [_, sku] of filtered) {
        mapped[sku.id] = sku;
    }

    // Assign to Core SKU Map:
    core.storeSKUs = mapped;
}