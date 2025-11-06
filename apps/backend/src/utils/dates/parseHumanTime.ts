import { parse } from "chrono-node"
import { DateTime } from "luxon"

export default (userInput:string, guildTimezone:string) => {
    // Confirm Timezone:
    const timezoneOpts = Intl.supportedValuesOf('timeZone')
    if(!timezoneOpts.includes(guildTimezone)) throw 'Invalid Time Zone! - Correct and try again!'

    // Get guilds current time ref - in preferred time zone:
    const guildsCurrentTime = DateTime.now().setZone(guildTimezone);
    if(!guildsCurrentTime.isValid) throw 'Invalid Guild ref/start date for conversion!';

    // Parse input text to future date:
    const parsedInput = parse(userInput, guildsCurrentTime.toJSDate(), {forwardDate: true});
    const parsedResult = parsedInput[0]?.start?.date();

    // Convert parsed date to preferred time zone:
    const convertedResult = DateTime.fromJSDate(parsedResult).setZone(guildTimezone);
    if(convertedResult.isValid){
        return convertedResult
    } else return null

}