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
  field: 'weeklyDuration' | 'warmUp' | 'coolDown' | 'fiveKTime' | 'dayPreferences'
  message: string
}

export const DAY_PREFERENCE_LIMITS = {
  rest: 2,
  easy: 2,
  long: 1,
  subT: SUB_THRESHOLD_SESSIONS,
} as const

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
  const { fiveKSeconds } = settings
  if (fiveKSeconds !== null && !(Number.isInteger(fiveKSeconds) && fiveKSeconds > 0))
    errors.push({
      field: 'fiveKTime',
      message: '5K Time must be minutes and seconds, e.g. 19:45',
    })
  for (const message of dayPreferenceErrors(settings))
    errors.push({ field: 'dayPreferences', message })
  return errors
}

function dayPreferenceErrors(settings: PlanSettings): string[] {
  const subT = daysPreferring(settings, 'subT')
  const errors: string[] = []
  for (const [preference, noun] of [
    ['rest', 'rest days'],
    ['easy', 'easy days'],
    ['long', 'long day'],
  ] as const) {
    const max = DAY_PREFERENCE_LIMITS[preference]
    const count = daysPreferring(settings, preference).length
    if (count > max) errors.push(`Maximum ${max} ${noun} allowed (you have ${count})`)
  }
  if (subT.length > DAY_PREFERENCE_LIMITS.subT)
    errors.push(`Maximum ${DAY_PREFERENCE_LIMITS.subT} SubT days allowed (you have ${subT.length})`)
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
