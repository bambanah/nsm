import { describe, expect, it } from 'vitest'
import { syncedWeek } from './synced-week'

const record = (monday: string, ranAt: string, differs = false) => ({
  monday,
  ranAt: new Date(ranAt),
  differs,
})

// Sunday 15 Nov 2026, evening
const sunday = new Date(2026, 10, 15, 19)

describe('syncedWeek', () => {
  it('on Sunday with this week and next week Synced, picks next week', () => {
    const nextWeek = record('2026-11-16', '2026-11-15T07:00:00Z')
    const thisWeek = record('2026-11-09', '2026-11-08T07:00:00Z')
    expect(syncedWeek([nextWeek, thisWeek], sunday)).toEqual(nextWeek)
  })

  it('has none when every Synced week has ended', () => {
    expect(syncedWeek([record('2026-11-02', '2026-11-01T07:00:00Z')], sunday)).toBeUndefined()
  })

  it('mid-week, picks this week', () => {
    const thisWeek = record('2026-11-09', '2026-11-08T07:00:00Z')
    const lastWeek = record('2026-11-02', '2026-11-01T07:00:00Z')
    expect(syncedWeek([thisWeek, lastWeek], new Date(2026, 10, 11, 12))).toEqual(thisWeek)
  })

  it('takes the latest Sync of a week Synced more than once', () => {
    const latest = record('2026-11-16', '2026-11-15T09:00:00Z', true)
    const earlier = record('2026-11-16', '2026-11-15T07:00:00Z')
    expect(syncedWeek([earlier, latest], sunday)).toEqual(latest)
  })
})
