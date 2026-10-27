import type { scheduledSyncs, syncRecords } from '@/db/schema'
import { latestSyncTime, targetMonday } from './sync-time'

type SavedSyncTime = Pick<
  typeof scheduledSyncs.$inferSelect,
  'weekday' | 'hour' | 'timeZone' | 'savedAt'
>
type SyncRecord = Pick<typeof syncRecords.$inferSelect, 'ranAt' | 'monday' | 'trigger' | 'outcome'>

export function scheduledSyncAction(
  scheduledSync: SavedSyncTime,
  records: SyncRecord[],
  now: Date,
) {
  const { weekday, hour, timeZone } = scheduledSync
  const syncTime = latestSyncTime(weekday, hour, timeZone, now)
  if (syncTime <= scheduledSync.savedAt) return null
  if (records.some((r) => r.trigger === 'scheduled' && r.ranAt >= syncTime)) return null
  const monday = targetMonday(syncTime, timeZone)
  const skip = records.some(
    (r) => r.trigger === 'manual' && r.outcome === 'succeeded' && r.monday === monday,
  )
  return { monday, skip }
}
