export interface PlanLimits {
  MAX_SCHEDULES: number;
  MAX_SIGNUP_CHANNELS: number
  MAX_RSVP_ROLES: number;
  MAX_RSVP_CAPACITY: number;
}

export type PlanName = 'FREE_PLAN' | 'PREMIUM_PLAN' | 'ENTERPRISE_PLAN';

export const pricingLimits: Record<PlanName, PlanLimits> = {
  FREE_PLAN: {
    MAX_SCHEDULES: 7,
    MAX_SIGNUP_CHANNELS: 1,
    MAX_RSVP_ROLES: 3,
    MAX_RSVP_CAPACITY: 10,
  },
  PREMIUM_PLAN: {
    MAX_SCHEDULES: 15,
    MAX_SIGNUP_CHANNELS: 3,
    MAX_RSVP_ROLES: 5,
    MAX_RSVP_CAPACITY: 20,
  },
  ENTERPRISE_PLAN: {
    MAX_SCHEDULES: Infinity,
    MAX_SIGNUP_CHANNELS: 5,
    MAX_RSVP_ROLES: 7,
    MAX_RSVP_CAPACITY: Infinity,
  },
};