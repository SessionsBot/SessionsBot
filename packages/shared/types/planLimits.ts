export interface PlanLimitValues {
  MAX_SCHEDULES: number;
  MAX_RSVP_SLOTS: number;
  MAX_RSVP_CAPACITY: number;
  ALLOW_NOTIFICATIONS: boolean
}

export type PlanName = 'FREE' | 'PREMIUM' | 'ENTERPRISE';

export const PlanLimits: Record<PlanName, PlanLimitValues> = {
  FREE: {
    MAX_SCHEDULES: 7,
    MAX_RSVP_SLOTS: 3,
    MAX_RSVP_CAPACITY: 10,
    ALLOW_NOTIFICATIONS: false
  },
  PREMIUM: {
    MAX_SCHEDULES: 15,
    MAX_RSVP_SLOTS: 5,
    MAX_RSVP_CAPACITY: 20,
    ALLOW_NOTIFICATIONS: true
  },
  ENTERPRISE: {
    MAX_SCHEDULES: Infinity,
    MAX_RSVP_SLOTS: 10,
    MAX_RSVP_CAPACITY: Infinity,
    ALLOW_NOTIFICATIONS: true
  },
};