export type SubscriptionPlanName = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

/** Subscription Plan SKU Ids indexed by name. 
 * @note **CHANGE BEFORE PRODUCTION** - CURRENTLY DEV SKUs */
export const SubscriptionSKUs = {
    PREMIUM: "1459624525925974088",
    ENTERPRISE: "1459624678426546310"
} as const;

/** According plan limits/restrictions by bot subscription level. */
export const SubscriptionLimits: Record<SubscriptionPlanName, {
    /** Maximum number of repeating session templates allowed for guild. */
    MAX_SCHEDULES: number;
    /** Maximum number of rsvp slots within session templates allowed for guild. */
    MAX_RSVP_SLOTS: number;
    /** Maximum capacity of rsvp slots allowed for guild. */
    MAX_RSVP_CAPACITY: number;
    /** Weather to allow RSVP restrictions by assigned guild roles. */
    ALLOW_RSVP_ROLE_RESTRICTION: boolean;
    /** Weather to allow session notifications based on subscription level. */
    ALLOW_NOTIFICATIONS: boolean;
    /** Weather to allow custom message accent colors based on subscription level. */
    CUSTOM_ACCENT_COLOR: boolean
    /** Weather to display a "Powered by Sessions Bot" text within Discord interactions/messages. */
    SHOW_WATERMARK: boolean
}> = {
    FREE: {
        MAX_SCHEDULES: 7,
        MAX_RSVP_SLOTS: 3,
        MAX_RSVP_CAPACITY: 10,
        ALLOW_RSVP_ROLE_RESTRICTION: false,
        ALLOW_NOTIFICATIONS: false,
        CUSTOM_ACCENT_COLOR: false,
        SHOW_WATERMARK: true,
    },
    PREMIUM: {
        MAX_SCHEDULES: 15,
        MAX_RSVP_SLOTS: 5,
        MAX_RSVP_CAPACITY: 20,
        ALLOW_RSVP_ROLE_RESTRICTION: true,
        ALLOW_NOTIFICATIONS: true,
        CUSTOM_ACCENT_COLOR: true,
        SHOW_WATERMARK: false,
    },
    ENTERPRISE: {
        MAX_SCHEDULES: Infinity,
        MAX_RSVP_SLOTS: 10,
        ALLOW_RSVP_ROLE_RESTRICTION: true,
        MAX_RSVP_CAPACITY: Infinity,
        ALLOW_NOTIFICATIONS: true,
        CUSTOM_ACCENT_COLOR: true,
        SHOW_WATERMARK: true,
    },
};


/** Subscription Level Plans available through Sessions Bot for Discord */
export const SubscriptionLevel: Record<SubscriptionPlanName, {
    /** The numbered index representing this subscription level. */
    level: number,
    /** Human readable string representing this subscription level. */
    title: string,
    /** Subscription Plan related limits and restrictions for plan level. */
    limits: typeof SubscriptionLimits[SubscriptionPlanName]
}> = {
    FREE: {
        level: 0,
        title: 'Free',
        limits: SubscriptionLimits.FREE
    },
    PREMIUM: {
        level: 1,
        title: 'Premium',
        limits: SubscriptionLimits.PREMIUM
    },
    ENTERPRISE: {
        level: 2,
        title: 'Enterprise',
        limits: SubscriptionLimits.ENTERPRISE
    }
} as const;


