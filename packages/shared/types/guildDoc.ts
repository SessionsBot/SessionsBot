export type ValueOf<T> = T[keyof T];

/**### ROOT Schema for Guild Database Docs */
export interface GuildDocData {
    /** Contains guild-wide configuration parameters and options. */
    configuration: {
        /** Guilds preferred accent color to use. */
        accentColor: string|null
        /** Indicates whether this server has a premium subscription. */
        subscriptionPlan: SubscriptionPlan
        /** Weather this guilds sessions are publicly viewable online without auth or not */
        privateSessions: false
        /** Guilds preferred time zone.*/
        timeZone:string
        /** Contains guild currently designated signup channels for sessions. */
        signupChannels: GuildSignupChannels
        /** Guilds currently configured scheduled sessions. */
        sessionSchedules: GuildSessionSchedules
    }

    /** Contains guilds upcoming/past sessions indexed by date string. */
    sessionTimeline: SessionTimeline

}


export type GuildSignupChannels = {
    [channelId: string]: {
        /** The daily time sessions will be posted if scheduled for the day under this signup channel. */
        signupPostTime: time24HRS
        /** The message id of the main "landing message" for this channel. */
        topMessageId: string,
        /** The custom name for this signup channel. */
        name: string
    }
}


export type SessionRsvps = {
    [
       /** Unique internal identifier for rsvp role. */
        RsvpId: string
    ]: {
        /** Name of RSVP role. - **MUST BE UNIQUE!** */
        name: string
        /** Capacity of this RSVP role. */
        capacity: number
        /** Emoji icon for this RSVP role. */
        emoji: string
        /** Currently assigned users by ID of this RSVP role. */
        users: string[]
    }
}


export type GuildSessionSchedules = {
    [scheduleId: string]: {
        /** Name of this session schedule. */
        title: string,
        /** Description of this session schedule. */
        description: string,
        /** The location/url this session takes place. */
        url?: string,
        /** RSVP roles for this session. *(if any)* */
        rsvps?: SessionRsvps,
        /** (Re-)Occurrence details for this session schedule */
        occurrence: SessionScheduleOccurrence
    }
}

export type SessionScheduleOccurrence = {
    /** The 24 HR time of day session actually occurs. */
    startTime: time24HRS,
    /** The days of week this session will occur. */
    weekdays: weekDayString[]|string[],
    /** The signup channel by id this schedule is posted to */
    signupChannelId: string,
}

export type SessionTimeline = {
    /** Sessions that are currently *active* / still intractable.
     * @param {string} dayString The session day path string e.g: `07-27-25` // `mm-dd-yy`
     */
    [dayString:string]: {
        /** @param {string} sessionId The session id for a certain session and it's data. */
        [sessionId: string]: GuildSessionData
    },

}

export type GuildSessionData = {
    /** Title of this session. */
    title: string
    /** Description of this session. */
    description: string
    /** Url/location of this session. *(if any)* */
    url?: string
    /** RSVPs of this session. *(if any)**/
    rsvps?: SessionRsvps
    /** Session Signup Msg Ids. */
    signup: GuildSessionSignup
    /** The time this session actually takes place. */
    startsAt: sessionTimeData
    /** Internal creation timestamp, used for marking stale after 24 hrs. */
    createdAt: Date
    /** Who/what created this guild session -> 'Schedules' or Discord user id.*/
    createdBy: string
    /** Status of session - Weather it has been canceled / postponed / or not. */
    state: 'scheduled'|'postponed'|'canceled'
}

export type GuildSessionSignup = {
    /** The signup channel id this session signup msg was sent to. */
    channelId: string
    /** The signup thread id this session signup msg was sent to. */
    threadId: string
    /** The message signup id for this session. */
    messageId: string
}

export type time24HRS = {
    /** Hour of day */
    hours: number, 
    /** Minute of hour */
    minuets: number
}

export interface sessionTimeData {
    /** 24 hour - hour of day the session 'occurs'. */
    hours: number,
    /** 24 hour - minuets of day the session 'occurs'. */
    minuets: number,
    /** The UTC Seconds / Discord Timestamp the session 'occurs'. */
    discordTimestamp: string
}

export enum weekDayString {monday='1', tuesday='2', wednesday='3', thursday='4', friday='5', saturday='6', sunday='7'}

export enum SubscriptionPlan {
    Free = 'free',
    Premium = 'premium',
    Enterprise = 'enterprise',
}