import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireUserId } from '@/auth/auth.server'
import { addDaysTo, mondayOf, parseDate } from '@/lib/week-dates'
import { findPlanSettings } from '@/plan-settings/plan-settings.server'
import { deriveWeek } from '@/planner/planner'
import { findSessionChoices } from '@/session-choices/session-choices.server'
import { findApiKey, hasApiKey, saveApiKey } from './intervals-connection.server'
import { replaceManagedWorkouts } from './intervals.server'
import { workouts } from './workouts'

const syncSchema = z.object({
  monday: z.iso.date().refine((d) => parseDate(d).getDay() === 1, 'Not a Monday'),
  apiKey: z.string().trim().min(1).optional(),
})

export const getIntervalsConnection = createServerFn({ method: 'GET' }).handler(async () => ({
  hasApiKey: await hasApiKey(await requireUserId()),
}))

export const syncWeek = createServerFn({ method: 'POST' })
  .validator(syncSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    // A week of slack for runners whose timezone is behind the server's.
    if (data.monday < addDaysTo(mondayOf(new Date()), -7))
      throw new Error('Pick the current week or later')
    const apiKey = data.apiKey ?? (await findApiKey(userId))
    if (!apiKey) throw new Error('Enter your intervals.icu API key')
    const settings = await findPlanSettings(userId)
    if (!settings) throw new Error('Save Plan Settings first')
    const week = deriveWeek(settings, await findSessionChoices(userId))
    await replaceManagedWorkouts(apiKey, data.monday, workouts(week, settings, data.monday))
    if (data.apiKey) await saveApiKey(userId, data.apiKey)
  })
