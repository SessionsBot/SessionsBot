import { GuildSessionData } from "@sessionsbot/shared"

export type RsvpResultString = "Success" | "Not Found / Outdated" | "Already Assigned" | "Already Occurred" | "At Capacity" | "Not Assigned" | "Internal Failure"

export class RsvpResult {

    /** The result in string format of this RSVP attempt. */
    public result:RsvpResultString
    /** The data attached to the RSVP result if any. */
    public data:{
        staleSessionData: GuildSessionData|null
    }

    constructor(result:RsvpResultString, data={
        staleSessionData: null
    }){
        this.result = result
        this.data = data
    }
}