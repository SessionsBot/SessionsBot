export interface PlanLimitData {
  MAX_SCHEDULES: number;
  MAX_RSVP_ROLES: number;
  MAX_RSVP_CAPACITY: number;
  ALLOW_NOTIFICATIONS: boolean
}

export type PlanName = 'FREE_PLAN' | 'PREMIUM_PLAN' | 'ENTERPRISE_PLAN';

export const PlanLimits: Record<PlanName, PlanLimitData> = {
  FREE_PLAN: {
    MAX_SCHEDULES: 7,
    MAX_RSVP_ROLES: 3,
    MAX_RSVP_CAPACITY: 10,
    ALLOW_NOTIFICATIONS: false
  },
  PREMIUM_PLAN: {
    MAX_SCHEDULES: 15,
    MAX_RSVP_ROLES: 5,
    MAX_RSVP_CAPACITY: 20,
    ALLOW_NOTIFICATIONS: true
  },
  ENTERPRISE_PLAN: {
    MAX_SCHEDULES: Infinity,
    MAX_RSVP_ROLES: 7,
    MAX_RSVP_CAPACITY: Infinity,
    ALLOW_NOTIFICATIONS: true
  },
};