import { describe, expect, it } from 'vitest'
import type { Day, PlanSettings, Week } from '@/planner/planner'
import { workouts } from './workouts'

const settings = (fiveKSeconds: number | null): PlanSettings => ({
  weeklyDurationMinutes: 360,
  warmUpMinutes: 15,
  coolDownMinutes: 10,
  dayPreferences: {},
  shuffle: 1,
  fiveKSeconds,
})

const subT: Day = {
  weekday: 'tuesday',
  type: 'subT',
  session: {
    repFormat: { repLength: 'HM', reps: 4, repMinutes: 7 },
    warmUpMinutes: 15,
    coolDownMinutes: 10,
    workMinutes: 28,
    recoveryMinutes: 1,
    minutes: 56,
  },
  plannerRepFormat: { repLength: 'HM', reps: 4, repMinutes: 7 },
}

const week = (days: Day[]): Week => ({
  days,
  totalMinutes: 0,
  subThresholdWorkMinutes: 0,
  subThresholdPercent: 0,
  subThresholdTargetPercent: 0,
})

describe('workouts', () => {
  it('creates an all-day Run workout per run day, named by type, skipping Rest Days', () => {
    const result = workouts(
      week([
        { weekday: 'monday', type: 'easy', minutes: 45 },
        subT,
        { weekday: 'wednesday', type: 'rest' },
        { weekday: 'sunday', type: 'long', minutes: 90 },
      ]),
      settings(null),
      '2026-10-26',
    )
    expect(result.map((w) => ({ ...w, description: undefined }))).toEqual([
      {
        category: 'WORKOUT',
        type: 'Run',
        start_date_local: '2026-10-26T00:00:00',
        name: 'Easy',
        external_id: 'nsm-2026-10-26',
      },
      {
        category: 'WORKOUT',
        type: 'Run',
        start_date_local: '2026-10-27T00:00:00',
        name: 'Sub-threshold',
        external_id: 'nsm-2026-10-27',
      },
      {
        category: 'WORKOUT',
        type: 'Run',
        start_date_local: '2026-11-01T00:00:00',
        name: 'Long',
        external_id: 'nsm-2026-11-01',
      },
    ])
  })

  it('describes Easy and Long Runs as a single duration step', () => {
    const [easy, long] = workouts(
      week([
        { weekday: 'monday', type: 'easy', minutes: 45 },
        { weekday: 'sunday', type: 'long', minutes: 90 },
      ]),
      settings(null),
      '2026-10-26',
    )
    expect(easy.description).toBe('- 45m')
    expect(long.description).toBe('- 90m')
  })

  it('describes a Sub-threshold Session with reps at the Rep Pace and the last rep outside the repeat', () => {
    const [session] = workouts(week([subT]), settings(20 * 60), '2026-10-26')
    expect(session.description).toBe(
      [
        'Warmup',
        '- 15m',
        '',
        '3x',
        '- 7m 4:21-4:29/km Pace',
        '- 1m',
        '',
        '- 7m 4:21-4:29/km Pace',
        '',
        'Cooldown',
        '- 10m',
      ].join('\n'),
    )
  })

  it('leaves reps without a pace target when there is no 5K Time', () => {
    const [session] = workouts(week([subT]), settings(null), '2026-10-26')
    expect(session.description).toBe(
      ['Warmup', '- 15m', '', '3x', '- 7m', '- 1m', '', '- 7m', '', 'Cooldown', '- 10m'].join('\n'),
    )
  })
})
