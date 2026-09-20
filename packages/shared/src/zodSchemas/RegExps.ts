/** Matches for a valid hex color code.
 * @ex `#123abc` | `#777` (short & long)*/
export const RegExp_HexColorCode = /^#([a-f0-9]{6})$/i

/** Matches for a **CUSTOM** Discord emoji id.
 * @ex `:customName:12345678912345678:`*/
export const RegExp_DiscordEmojiId = /<a?:[A-Za-z0-9]+:\d{17,}>/

/** Matches for a **Default** Text emoji as `string`.
 * @allows Emoji variants (see examples)
 * @ex `🏳️‍🌈`, `😊`, `🧑‍🔬`*/
export const RegExp_DefaultEmojiString = /^(?:\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?(?:\u200D(?:\p{Extended_Pictographic}(?:\p{Emoji_Modifier}|\uFE0F)?))*|\p{Regional_Indicator}{2}|[#*0-9]\uFE0F\u20E3)$/u