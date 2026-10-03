import {
  combinations,
  daysPreferring,
  isWellSpaced,
  MAX_WEEKLY_DURATION_MINUTES,
  MIN_WEEKLY_DURATION_MINUTES,
  SUB_THRESHOLD_SESSIONS,
  type PlanSettings,
} from './planner'

export interface PlanSettingsError {
  field: 'weeklyDuration' | 'warmUp' | 'coolDown' | 'dayPreferences'
  message: string
}

const hoursAndMinutes = (minutes: number) => `${Math.floor(minutes / 60)}h ${minutes % 60}m`

const isIntegerBetween = (value: number, min: number, max: number) =>
  Number.isInteger(value) && value >= min && value <= max

export function validatePlanSettings(settings: PlanSettings): PlanSettingsError[] {
  const errors: PlanSettingsError[] = []
  if (
    !isIntegerBetween(
      settings.weeklyDurationMinutes,
      MIN_WEEKLY_DURATION_MINUTES,
      MAX_WEEKLY_DURATION_MINUTES,
    )
  )
    errors.push({
      field: 'weeklyDuration',
      message: `Weekly Duration must be between ${hoursAndMinutes(MIN_WEEKLY_DURATION_MINUTES)} and ${hoursAndMinutes(MAX_WEEKLY_DURATION_MINUTES)}`,
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
  for (const message of dayPreferenceErrors(settings))
    errors.push({ field: 'dayPreferences', message })
  return errors
}

function dayPreferenceErrors(settings: PlanSettings): string[] {
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
  if (subT.length > SUB_THRESHOLD_SESSIONS)
    errors.push(`Maximum ${SUB_THRESHOLD_SESSIONS} SubT days allowed (you have ${subT.length})`)
  if (!isWellSpaced(subT))
    errors.push(
      'Preferred SubT days cannot be on adjacent days (Sunday and Monday count as adjacent)',
    )
  if (errors.length > 0) return errors

  const defaults = daysPreferring(settings, 'default')
  const need = SUB_THRESHOLD_SESSIONS - subT.length
  if (!combinations(defaults, need).some((days) => isWellSpaced([...days, ...subT])))
    return [
      `Not enough Default days to place ${SUB_THRESHOLD_SESSIONS} Sub-threshold Sessions on non-adjacent days`,
    ]
  if (daysPreferring(settings, 'long').length === 0 && defaults.length === need)
    return ['No Default or Long day left for the Long Run']
  return []
}
