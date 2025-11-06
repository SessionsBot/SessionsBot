import { DateTime } from "luxon"

/** Get a session timeline database path for a certain day by specified inputs.
 * @param {string} timeZone The guilds configured time zone to create a session day timeline path for.
 * @param {string} UtcSeconds The discord timestamp / UTC Seconds to 'trace back' into a session day timeline path.
 */
export default (timeZone:string, UtcSeconds?:string|number) => {
    if(UtcSeconds){
        return DateTime.fromSeconds(Number(UtcSeconds)).setZone(timeZone).toFormat(`LL-dd-yy`);
    }else{
        return DateTime.now().setZone(timeZone).toFormat(`LL-dd-yy`);
    }
   
}