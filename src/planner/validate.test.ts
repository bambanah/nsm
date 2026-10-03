import { describe, expect, it } from 'vitest'
import type { PlanSettings } from './planner'
import { validatePlanSettings } from './validate'

const settings = (overrides: Partial<PlanSettings> = {}): PlanSettings => ({
  weeklyDurationMinutes: 360,
  warmUpMinutes: 10,
  coolDownMinutes: 10,
  dayPreferences: {},
  shuffle: 1,
  fiveKSeconds: null,
  ...overrides,
})

describe('validatePlanSettings', () => {
  it.each([300, 360, 540])('accepts a Weekly Duration of %i minutes', (weeklyDurationMinutes) => {
    expect(validatePlanSettings(settings({ weeklyDurationMinutes }))).toEqual([])
  })

  it.each([299, 541, 360.5, Number.NaN])(
    'rejects a Weekly Duration of %s minutes',
    (weeklyDurationMinutes) => {
      expect(validatePlanSettings(settings({ weeklyDurationMinutes }))).toEqual([
        {
          field: 'weeklyDuration',
          message: 'Weekly Duration must be between 5h 0m and 9h 0m',
        },
      ])
    },
  )

  it('rejects warm-up and cool-down outside 5-20 minutes', () => {
    expect(validatePlanSettings(settings({ warmUpMinutes: 25, coolDownMinutes: 4 }))).toEqual([
      { field: 'warmUp', message: 'Warm-up must be between 5 and 20 minutes' },
      { field: 'coolDown', message: 'Cool-down must be between 5 and 20 minutes' },
    ])
  })
  it.each([null, 1, 1185])('accepts a 5K Time of %s seconds', (fiveKSeconds) => {
    expect(validatePlanSettings(settings({ fiveKSeconds }))).toEqual([])
  })

  it.each([0, -60, 1185.5, Number.NaN])('rejects a 5K Time of %s seconds', (fiveKSeconds) => {
    expect(validatePlanSettings(settings({ fiveKSeconds }))).toEqual([
      { field: 'fiveKTime', message: '5K Time must be minutes and seconds, e.g. 19:45' },
    ])
  })

  const preferenceErrors = (overrides: Partial<PlanSettings>) =>
    validatePlanSettings(settings(overrides)).map((e) => {
      expect(e.field).toBe('dayPreferences')
      return e.message
    })

  it('limits Rest, Easy and Long preferences', () => {
    expect(
      preferenceErrors({
        dayPreferences: {
          monday: 'rest',
          tuesday: 'rest',
          wednesday: 'rest',
          thursday: 'easy',
          friday: 'easy',
          saturday: 'easy',
          sunday: 'long',
        },
      }),
    ).toEqual([
      'Maximum 2 rest days allowed (you have 3)',
      'Maximum 2 easy days allowed (you have 3)',
    ])
    expect(preferenceErrors({ dayPreferences: { saturday: 'long', sunday: 'long' } })).toEqual([
      'Maximum 1 long day allowed (you have 2)',
    ])
  })

  it('limits SubT preferences to the three Sub-threshold Sessions', () => {
    expect(
      preferenceErrors({
        weeklyDurationMinutes: 300,
        dayPreferences: { monday: 'subT', wednesday: 'subT', friday: 'subT' },
      }),
    ).toEqual([])
    expect(
      preferenceErrors({
        dayPreferences: { monday: 'subT', wednesday: 'subT', friday: 'subT', sunday: 'subT' },
      }),
    ).toEqual([
      'Maximum 3 SubT days allowed (you have 4)',
      'Preferred SubT days cannot be on adjacent days (Sunday and Monday count as adjacent)',
    ])
  })

  it.each([
    { tuesday: 'subT', wednesday: 'subT' },
    { sunday: 'subT', monday: 'subT' },
  ] as const)('rejects adjacent SubT preferences %o', (dayPreferences) => {
    expect(preferenceErrors({ dayPreferences })).toEqual([
      'Preferred SubT days cannot be on adjacent days (Sunday and Monday count as adjacent)',
    ])
  })

  it('rejects preferences that leave too few Default days for non-adjacent Sub-threshold Sessions', () => {
    expect(
      preferenceErrors({
        dayPreferences: {
          monday: 'rest',
          tuesday: 'rest',
          wednesday: 'easy',
          thursday: 'easy',
        },
      }),
    ).toEqual(['Not enough Default days to place 3 Sub-threshold Sessions on non-adjacent days'])
  })

  it('rejects preferences that leave no day for the Long Run', () => {
    expect(
      preferenceErrors({
        dayPreferences: {
          monday: 'rest',
          wednesday: 'rest',
          friday: 'easy',
          sunday: 'easy',
        },
      }),
    ).toEqual(['No Default or Long day left for the Long Run'])
  })
})
