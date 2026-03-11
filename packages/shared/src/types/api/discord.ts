export type API_DiscordUserIdentity = {
    username: string,
    displayName?: string,
    avatarUrl?: string,
    bot: boolean,
}

export type API_DiscordGuildIdentity = {
    name: string,
    iconUrl?: string,
    bannerUrl?: string,
}