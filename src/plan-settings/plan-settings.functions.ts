import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireUserId } from '@/auth/auth.server'
import { randomShuffle, WEEKDAYS } from '@/planner/planner'
import { validatePlanSettings } from '@/planner/validate'
import { findPlanSettings, updateShuffle, upsertPlanSettings } from './plan-settings.server'

const planSettingsSchema = z.object({
  weeklyDurationMinutes: z.number(),
  warmUpMinutes: z.number(),
  coolDownMinutes: z.number(),
  dayPreferences: z.partialRecord(z.enum(WEEKDAYS), z.enum(['rest', 'easy', 'long', 'subT'])),
  shuffle: z
    .int()
    .min(0)
    .max(2 ** 31 - 1),
})

export const getPlanSettings = createServerFn({ method: 'GET' }).handler(async () =>
  findPlanSettings(await requireUserId()),
)

export const savePlanSettings = createServerFn({ method: 'POST' })
  .validator(planSettingsSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const errors = validatePlanSettings(data)
    if (errors.length > 0) throw new Error(errors.map((e) => e.message).join(', '))
    await upsertPlanSettings(userId, data)
  })

export const reshuffle = createServerFn({ method: 'POST' }).handler(async () => {
  const shuffle = randomShuffle()
  await updateShuffle(await requireUserId(), shuffle)
  return shuffle
})
