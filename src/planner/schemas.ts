import { z } from 'zod'
import { DAY_PREFERENCES, WEEKDAYS } from './planner'
import { REP_LENGTHS } from './rep-formats'

export const planSettingsSchema = z.object({
  weeklyDurationMinutes: z.number(),
  warmUpMinutes: z.number(),
  coolDownMinutes: z.number(),
  dayPreferences: z.partialRecord(z.enum(WEEKDAYS), z.enum(DAY_PREFERENCES).exclude(['default'])),
  shuffle: z
    .int()
    .min(0)
    .max(2 ** 31 - 1),
  fiveKSeconds: z.number().nullable(),
})

export const weekdaySchema = z.object({
  weekday: z.enum(WEEKDAYS),
})

export const sessionChoiceSchema = weekdaySchema.extend({
  repFormat: z.object({
    repLength: z.enum(REP_LENGTHS),
    reps: z.int(),
    repMinutes: z.int(),
  }),
})

export const guestPlanSchema = z.object({
  settings: planSettingsSchema,
  sessionChoices: z.array(sessionChoiceSchema),
})
