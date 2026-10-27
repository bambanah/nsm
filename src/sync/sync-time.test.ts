import { describe, expect, it } from 'vitest'
import { latestSyncTime, targetMonday } from './sync-time'

describe('latestSyncTime', () => {
  // Wednesday 28 Oct 2026, 10:00 in Melbourne (UTC+11)
  const wednesdayMorning = new Date('2026-10-27T23:00:00Z')

  it('finds the most recent Sync Time earlier in the week', () => {
    expect(latestSyncTime('sunday', 18, 'Australia/Melbourne', wednesdayMorning)).toEqual(
      new Date('2026-10-25T07:00:00Z'),
    )
  })

  it('goes back a week when the Sync Time is later today', () => {
    expect(latestSyncTime('wednesday', 18, 'Australia/Melbourne', wednesdayMorning)).toEqual(
      new Date('2026-10-21T07:00:00Z'),
    )
  })

  it('counts a Sync Time that is exactly now', () => {
    expect(latestSyncTime('wednesday', 10, 'Australia/Melbourne', wednesdayMorning)).toEqual(
      wednesdayMorning,
    )
  })

  it('uses the weekday in a timezone behind UTC', () => {
    // Monday 26 Oct 2026, 23:30 in New York, already Tuesday in UTC
    const now = new Date('2026-10-27T03:30:00Z')
    expect(latestSyncTime('monday', 23, 'America/New_York', now)).toEqual(
      new Date('2026-10-27T03:00:00Z'),
    )
  })

  it('keeps the local hour across the start of daylight saving', () => {
    // Monday 5 Oct 2026 in Melbourne, the day after clocks went forward
    const now = new Date('2026-10-04T23:00:00Z')
    expect(latestSyncTime('saturday', 18, 'Australia/Melbourne', now)).toEqual(
      new Date('2026-10-03T08:00:00Z'),
    )
  })

  it('keeps the local hour across the end of daylight saving', () => {
    // Monday 6 Apr 2026, 09:00 in Melbourne, the day after clocks went back
    const now = new Date('2026-04-05T23:00:00Z')
    expect(latestSyncTime('saturday', 18, 'Australia/Melbourne', now)).toEqual(
      new Date('2026-04-04T07:00:00Z'),
    )
  })
})

describe('targetMonday', () => {
  it('is the same day for a Monday Sync Time', () => {
    // Monday 26 Oct 2026, 06:00 in Melbourne
    expect(targetMonday(new Date('2026-10-25T19:00:00Z'), 'Australia/Melbourne')).toBe('2026-10-26')
  })

  it('is next Monday for any other day', () => {
    // Sunday 25 Oct 2026, 18:00 in Melbourne
    expect(targetMonday(new Date('2026-10-25T07:00:00Z'), 'Australia/Melbourne')).toBe('2026-10-26')
  })

  it('uses the local date near midnight', () => {
    // Sunday 25 Oct 2026, 23:00 in New York, already Monday in UTC
    expect(targetMonday(new Date('2026-10-26T03:00:00Z'), 'America/New_York')).toBe('2026-10-26')
    // Monday 26 Oct 2026, 00:00 in Melbourne, still Sunday in UTC
    expect(targetMonday(new Date('2026-10-25T13:00:00Z'), 'Australia/Melbourne')).toBe('2026-10-26')
  })
})
