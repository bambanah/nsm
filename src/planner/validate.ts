import {
  combinations,
  daysPreferring,
  isWellSpaced,
  sessionCount,
  type PlanSettings,
} from './planner'

export interface PlanSettingsError {
  field: 'weeklyDuration' | 'warmUp' | 'coolDown' | 'dayPreferences'
  message: string
}

const isIntegerBetween = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max

export function validatePlanSettings(settings: PlanSettings): PlanSettingsError[] {
  const errors: PlanSettingsError[] = []
  if (!isIntegerBetween(settings.weeklyDurationMinutes, 240, 600))
    errors.push({
      field: 'weeklyDuration',
      message: 'Weekly Duration must be between 4h 0m and 10h 0m',
    })
  if (!isIntegerBetween(settings.warmUpMinutes, 5, 20))
    errors.push({
      field: 'warmUp',
      message: 'Warm-up must be between 5 and 20 minutes',
    })
  if (!isIntegerBetween(settings.coolDownMinutes, 5, 20))
    errors.push({
      field: 'coolDown',
      message: 'Cool-down must be between 5 and 20 minutes',
    })
  for (const message of dayPreferenceErrors(
    settings,
    errors.length === 0 ? sessionCount(settings.weeklyDurationMinutes) : undefined,
  ))
    errors.push({ field: 'dayPreferences', message })
  return errors
}

function dayPreferenceErrors(settings: PlanSettings, sessions: number | undefined): string[] {
  const subT = daysPreferring(settings, 'subT')
  const errors: string[] = []
  for (const [preference, max, noun] of [
    ['rest', 2, 'rest days'],
    ['easy', 2, 'easy days'],
    ['long', 1, 'long day'],
  ] as const) {
    const count = daysPreferring(settings, preference).length
    if (count > max) errors.push(`Maximum ${max} ${noun} allowed (you have ${count})`)
  }
  if (sessions === undefined && subT.length > 3)
    errors.push(`Maximum 3 SubT days allowed (you have ${subT.length})`)
  if (sessions !== undefined && subT.length > sessions)
    errors.push(
      `This Weekly Duration has ${sessions} Sub-threshold Sessions, so at most ${sessions} SubT days (you have ${subT.length})`,
    )
  if (!isWellSpaced(subT))
    errors.push(
      'Preferred SubT days cannot be on adjacent days (Sunday and Monday count as adjacent)',
    )
  if (errors.length > 0 || sessions === undefined) return errors

  const defaults = daysPreferring(settings, 'default')
  const need = sessions - subT.length
  if (!combinations(defaults, need).some((days) => isWellSpaced([...days, ...subT])))
    return [
      `Not enough Default days to place ${sessions} Sub-threshold Sessions on non-adjacent days`,
    ]
  if (daysPreferring(settings, 'long').length === 0 && defaults.length === need)
    return ['No Default or Long day left for the Long Run']
  return []
}
