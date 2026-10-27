import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireUserId } from '@/auth/auth.server'
import { addDaysTo, mondayOf, parseDate } from '@/lib/week-dates'
import { WEEKDAYS } from '@/planner/planner'
import { hasApiKey, saveApiKey } from './intervals-connection.server'
import { findScheduledSync, findSyncHistory, runSync, upsertScheduledSync } from './sync.server'

const syncSchema = z.object({
  monday: z.iso.date().refine((d) => parseDate(d).getDay() === 1, 'Not a Monday'),
  apiKey: z.string().trim().min(1).optional(),
})

const scheduledSyncSchema = z.object({
  enabled: z.boolean(),
  weekday: z.enum(WEEKDAYS),
  hour: z.number().int().min(0).max(23),
  timeZone: z.string().refine((timeZone) => {
    try {
      new Intl.DateTimeFormat('en', { timeZone })
      return true
    } catch {
      return false
    }
  }, 'Unknown timezone'),
})

export const getSyncState = createServerFn({ method: 'GET' }).handler(async () => {
  const userId = await requireUserId()
  const [apiKeySaved, scheduledSync, syncHistory] = await Promise.all([
    hasApiKey(userId),
    findScheduledSync(userId),
    findSyncHistory(userId),
  ])
  return { hasApiKey: apiKeySaved, scheduledSync, syncHistory }
})

export const syncWeek = createServerFn({ method: 'POST' })
  .validator(syncSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    // A week of slack for runners whose timezone is behind the server's.
    if (data.monday < addDaysTo(mondayOf(new Date()), -7))
      throw new Error('Pick the current week or later')

    await runSync(userId, data.monday, 'manual', data.apiKey)

    if (data.apiKey) await saveApiKey(userId, data.apiKey)
  })

export const saveScheduledSync = createServerFn({ method: 'POST' })
  .validator(scheduledSyncSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    if (data.enabled && !(await hasApiKey(userId)))
      throw new Error('Save your intervals.icu API key first')
    await upsertScheduledSync(userId, data)
  })
