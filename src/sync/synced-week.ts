import { mondayOf } from '@/lib/week-dates'

export interface SyncedWeekRecord {
  monday: string
  ranAt: Date
}

export function syncedWeek<R extends SyncedWeekRecord>(succeeded: R[], now: Date) {
  const currentMonday = mondayOf(now)
  return succeeded
    .filter((r) => r.monday >= currentMonday)
    .reduce<R | undefined>(
      (best, r) =>
        !best || r.monday > best.monday || (r.monday === best.monday && r.ranAt > best.ranAt)
          ? r
          : best,
      undefined,
    )
}
