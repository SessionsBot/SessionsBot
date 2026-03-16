import { DateTime } from "luxon";

export const MigratingTemplates_DeletionDate = DateTime.now().plus({ day: 30 })