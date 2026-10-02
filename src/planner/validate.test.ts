import { describe, expect, it } from 'vitest'
import type { PlanSettings } from './planner'
import { validatePlanSettings } from './validate'

const settings = (overrides: Partial<PlanSettings> = {}): PlanSettings => ({
  weeklyDurationMinutes: 360,
  warmUpMinutes: 10,
  coolDownMinutes: 10,
  dayPreferences: {},
  shuffle: 1,
  ...overrides,
})

describe('validatePlanSettings', () => {
  it('accepts valid Plan Settings', () => {
    expect(validatePlanSettings(settings())).toEqual([])
  })

  it.each([239, 601, 360.5, Number.NaN])(
    'rejects a Weekly Duration of %s minutes',
    (weeklyDurationMinutes) => {
      expect(validatePlanSettings(settings({ weeklyDurationMinutes }))).toEqual([
        {
          field: 'weeklyDuration',
          message: 'Weekly Duration must be between 4h 0m and 10h 0m',
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

  it('limits SubT preferences to the Sub-threshold Sessions at that Weekly Duration', () => {
    const dayPreferences = {
      monday: 'subT',
      wednesday: 'subT',
      friday: 'subT',
    } as const
    expect(preferenceErrors({ weeklyDurationMinutes: 240, dayPreferences })).toEqual([
      'This Weekly Duration has 2 Sub-threshold Sessions, so at most 2 SubT days (you have 3)',
    ])
    expect(preferenceErrors({ weeklyDurationMinutes: 259, dayPreferences })).toEqual([])
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
