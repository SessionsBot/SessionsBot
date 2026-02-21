import { DateTime } from "luxon"
import core from "../../core/core";

/** Transforms string by a dedicated variable format. See {@link variableMap} */
export function processVariableText(text: string, opts?: { displayDate: DateTime }) {

    // Get/Parse Options:
    const date = opts?.displayDate ?? DateTime.now();

    // String replace variable(s) - Map:
    const variableMap = {
        '%day_sm%': date.month + '/' + date.day,
        '%day_md%': date.toFormat('M/d/yy'),
        '%day_lg%': date.toFormat('DD'),
    }

    // Add Custom Bot Emojis to Variable Map:
    for (const [name, id] of Object.entries(core.emojis.ids)) {
        variableMap[`%${name}%`] = core.emojis.string(name as any)
    }

    const keys = Object.keys(variableMap)
    // check for & replace variable keys:
    let r = text
    for (const key of keys) {
        const searchExp = new RegExp(`${key}`, 'g')
        const replaceVal = variableMap[key] as string
        r = r?.replace(searchExp, replaceVal)
    }
    return r
}