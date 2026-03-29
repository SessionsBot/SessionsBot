import { toHTML } from '@odiffey/discord-markdown'
import { DateTime } from 'luxon'

export const getDiscordHtml = (raw: string) => {
    return toHTML(raw, {
        embed: true,
        discordOnly: false,
        discordCallback: {
            role(node) { return `@Role` },
            channel(node) { return `#Channel` },
            user(node) { return `@User` },
            slash(node) { return '/command' },
            timestamp(node) {
                if (!isNaN(node.timestamp)) {
                    if (node.style == 'R') {
                        return DateTime.fromSeconds(Number(node.timestamp))?.toRelative() ?? "TIMESTAMP"
                    }
                    const styleToken = () => {
                        if (node.style == 't') return 't'
                        else if (node.style == 'T') return 'tt'
                        else if (node.style == 'd') return 'D'
                        else if (node.style == 'D') return 'DDD'
                        else if (node.style == 'f') return `DDD 'at' t`
                        else if (node.style == 'F') return `DDD 'at' t`
                        else return 'f'
                    }
                    return DateTime.fromSeconds(Number(node.timestamp))?.toFormat(styleToken())
                } else return "TIMESTAMP"

            }
        }
    })
}