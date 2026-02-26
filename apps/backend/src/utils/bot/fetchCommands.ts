import core from '../core/core.js'

export default async () => {
    // Fetch App Commands:
    const fetch = await core.botClient.application.commands.fetch()

    // Map by Name & Cmd Id:
    let mapped: typeof core.commands.ids = {} as any;
    for (const [_, cmd] of fetch) {
        mapped[cmd.name] = cmd.id;
    }

    // Assign to Core SKU Map:
    core.commands.ids = mapped;
}