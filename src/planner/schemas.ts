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

const weekdaySchema = z.object({
  weekday: z.enum(WEEKDAYS),
})

const repFormatSchema = z.object({
  repLength: z.enum(REP_LENGTHS),
  reps: z.int(),
  repMinutes: z.int(),
})

const sessionChoiceSchema = weekdaySchema.extend({ repFormat: repFormatSchema })

export const chooseSessionSchema = weekdaySchema.extend({
  settings: planSettingsSchema,
  repFormat: repFormatSchema.optional(),
})

export const planningStateSchema = z.object({
  settings: planSettingsSchema,
  sessionChoices: z.array(sessionChoiceSchema),
})
