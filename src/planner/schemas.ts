import { z } from 'zod'
import {
  DAY_PREFERENCES,
  DEFAULT_EASY_HEART_RATE_MAX_PERCENT,
  DEFAULT_EASY_HEART_RATE_MIN_PERCENT,
  WEEKDAYS,
} from './planner'
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
  // Defaults keep Guest plans saved before Easy Heart Rate existed.
  easyHeartRateMinPercent: z.number().default(DEFAULT_EASY_HEART_RATE_MIN_PERCENT),
  easyHeartRateMaxPercent: z.number().default(DEFAULT_EASY_HEART_RATE_MAX_PERCENT),
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
