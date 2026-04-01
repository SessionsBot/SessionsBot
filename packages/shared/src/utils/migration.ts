import { DateTime } from "luxon";

export const MigratingTemplates_DeletionDate = DateTime.utc().setZone('America/Chicago').set({ day: 31, month: 3, year: 2026 })?.startOf('day')?.plus({ day: 30 }) // DateTime.now().plus({ day: 30 })