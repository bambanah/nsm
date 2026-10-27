import { subDays } from 'date-fns'
import { and, desc, eq, gte } from 'drizzle-orm'
import { db } from '@/db/db.server'
import { scheduledSyncs, syncRecords } from '@/db/schema'
import { isoDate } from '@/lib/week-dates'
import { findPlanSettings } from '@/plan-settings/plan-settings.server'
import { deriveWeek, type Weekday } from '@/planner/planner'
import { findSessionChoices } from '@/session-choices/session-choices.server'
import { findApiKey } from './intervals-connection.server'
import { replaceManagedWorkouts } from './intervals.server'
import { scheduledSyncAction } from './scheduled-sync'
import { workouts } from './workouts'

type Trigger = (typeof syncRecords.$inferSelect)['trigger']
type Outcome = (typeof syncRecords.$inferSelect)['outcome']

export interface ScheduledSync {
  enabled: boolean
  weekday: Weekday
  hour: number
  timeZone: string
}

const record = (
  userId: string,
  monday: string,
  trigger: Trigger,
  outcome: Outcome,
  error?: string,
) => db.insert(syncRecords).values({ userId, ranAt: new Date(), monday, trigger, outcome, error })

export async function runSync(userId: string, monday: string, trigger: Trigger, apiKey?: string) {
  try {
    const key = apiKey ?? (await findApiKey(userId))
    if (!key) throw new Error('Enter your intervals.icu API key')

    const settings = await findPlanSettings(userId)
    if (!settings) throw new Error('Save Plan Settings first')

    const week = deriveWeek(settings, await findSessionChoices(userId))
    await replaceManagedWorkouts(key, monday, workouts(week, settings, monday))
  } catch (e) {
    await record(userId, monday, trigger, 'failed', (e as Error).message)
    throw e
  }
  await record(userId, monday, trigger, 'succeeded')
}

export async function runDueScheduledSyncs(now: Date) {
  const due = await db.select().from(scheduledSyncs).where(eq(scheduledSyncs.enabled, true))
  for (const scheduledSync of due) {
    const { userId } = scheduledSync
    try {
      // Covers every Sync Record that can affect the latest Sync Time, which is under a week ago.
      const records = await db
        .select()
        .from(syncRecords)
        .where(
          and(eq(syncRecords.userId, userId), gte(syncRecords.monday, isoDate(subDays(now, 14)))),
        )
      const action = scheduledSyncAction(scheduledSync, records, now)
      if (!action) continue
      if (action.skip) await record(userId, action.monday, 'scheduled', 'skipped')
      else await runSync(userId, action.monday, 'scheduled')
    } catch (e) {
      console.error(`Scheduled Sync failed for user ${userId}`, e)
    }
  }
}

export async function findScheduledSync(userId: string): Promise<ScheduledSync | null> {
  const [row] = await db
    .select({
      enabled: scheduledSyncs.enabled,
      weekday: scheduledSyncs.weekday,
      hour: scheduledSyncs.hour,
      timeZone: scheduledSyncs.timeZone,
    })
    .from(scheduledSyncs)
    .where(eq(scheduledSyncs.userId, userId))
  return row ?? null
}

export async function upsertScheduledSync(userId: string, scheduledSync: ScheduledSync) {
  // Only Sync Times after this moment count, so turning on never Syncs straight away.
  const values = { ...scheduledSync, savedAt: new Date(), updatedAt: new Date() }
  await db
    .insert(scheduledSyncs)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: scheduledSyncs.userId, set: values })
}

export function findSyncHistory(userId: string) {
  return db
    .select({
      id: syncRecords.id,
      ranAt: syncRecords.ranAt,
      monday: syncRecords.monday,
      trigger: syncRecords.trigger,
      outcome: syncRecords.outcome,
      error: syncRecords.error,
    })
    .from(syncRecords)
    .where(eq(syncRecords.userId, userId))
    .orderBy(desc(syncRecords.ranAt), desc(syncRecords.id))
    .limit(10)
}
