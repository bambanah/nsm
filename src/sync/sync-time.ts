import { TZDate } from '@date-fns/tz'
import { addDays } from 'date-fns'
import { isoDate } from '@/lib/week-dates'
import { WEEKDAYS, type Weekday } from '@/planner/planner'

const jsDay = (weekday: Weekday) => (WEEKDAYS.indexOf(weekday) + 1) % 7

export function latestSyncTime(weekday: Weekday, hour: number, timeZone: string, now: Date) {
  const local = new TZDate(now, timeZone)
  const syncTimeDaysAgo = (daysBack: number) =>
    new TZDate(
      local.getFullYear(),
      local.getMonth(),
      local.getDate() - daysBack,
      hour,
      0,
      0,
      0,
      timeZone,
    )
  const daysBack = (local.getDay() - jsDay(weekday) + 7) % 7
  const syncTime = syncTimeDaysAgo(daysBack)
  return new Date(+(syncTime > now ? syncTimeDaysAgo(daysBack + 7) : syncTime))
}

export function targetMonday(syncTime: Date, timeZone: string) {
  const local = new TZDate(syncTime, timeZone)
  return isoDate(addDays(local, (8 - local.getDay()) % 7))
}
