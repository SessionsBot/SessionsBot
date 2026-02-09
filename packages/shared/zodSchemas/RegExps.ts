/** Matches for a valid hex color code.
 * @ex `#123abc` | `#777` (short & long)*/
export const RegExp_HexColorCode = /^#([a-f0-9]{6}|[a-f0-9]{3})$/i