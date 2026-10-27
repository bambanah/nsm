import { describe, expect, it } from 'vitest'
import { scheduledSyncAction } from './scheduled-sync'

const scheduledSync = {
  weekday: 'sunday' as const,
  hour: 18,
  timeZone: 'Australia/Melbourne',
  savedAt: new Date('2026-10-20T00:00:00Z'),
}
// Sunday 25 Oct 2026, 18:00 in Melbourne
const syncTime = new Date('2026-10-25T07:00:00Z')
const now = new Date('2026-10-25T08:00:00Z')

const record = (
  ranAt: Date,
  trigger: 'manual' | 'scheduled',
  outcome: 'succeeded' | 'failed' | 'skipped',
  monday = '2026-10-26',
) => ({ ranAt, monday, trigger, outcome })

describe('scheduledSyncAction', () => {
  it('Syncs the next calendar week once the Sync Time has passed', () => {
    expect(scheduledSyncAction(scheduledSync, [], now)).toEqual({
      monday: '2026-10-26',
      skip: false,
    })
  })

  it('does nothing for a Sync Time before the Sync Time was saved', () => {
    expect(scheduledSyncAction({ ...scheduledSync, savedAt: now }, [], now)).toBeNull()
    expect(scheduledSyncAction({ ...scheduledSync, savedAt: syncTime }, [], now)).toBeNull()
  })

  it('does nothing once a Scheduled Sync has run since the Sync Time, whatever its outcome', () => {
    for (const outcome of ['succeeded', 'failed', 'skipped'] as const)
      expect(
        scheduledSyncAction(scheduledSync, [record(syncTime, 'scheduled', outcome)], now),
      ).toBeNull()
  })

  it('runs again after a Scheduled Sync of the same week before the Sync Time', () => {
    const earlier = new Date('2026-10-24T07:00:00Z')
    expect(
      scheduledSyncAction(scheduledSync, [record(earlier, 'scheduled', 'succeeded')], now),
    ).toEqual({ monday: '2026-10-26', skip: false })
  })

  it('skips a calendar week already Synced manually, whenever that was', () => {
    const longAgo = new Date('2026-09-01T00:00:00Z')
    expect(
      scheduledSyncAction(scheduledSync, [record(longAgo, 'manual', 'succeeded')], now),
    ).toEqual({ monday: '2026-10-26', skip: true })
  })

  it('does not skip for a failed manual Sync or a manual Sync of another week', () => {
    const records = [
      record(syncTime, 'manual', 'failed'),
      record(syncTime, 'manual', 'succeeded', '2026-10-19'),
    ]
    expect(scheduledSyncAction(scheduledSync, records, now)).toEqual({
      monday: '2026-10-26',
      skip: false,
    })
  })
})
