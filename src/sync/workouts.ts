import { addDaysTo } from '@/lib/week-dates'
import {
  DAY_TYPE_LABELS,
  WEEKDAYS,
  type Day,
  type PlanSettings,
  type Week,
} from '@/planner/planner'
import { repFormatLabel } from '@/planner/rep-formats'
import { formatRepPace, repPaces, type RepPaces } from '@/planner/rep-paces'

export const EXTERNAL_ID_PREFIX = 'nsm-'
export const EASY_HR_PERCENT = '60-70%'
const EASY_HR = `${EASY_HR_PERCENT} HR`

export interface Workout {
  category: 'WORKOUT'
  type: 'Run'
  start_date_local: string
  name: string
  description: string
  external_id: string
}

export function workouts(week: Week, settings: PlanSettings, monday: string): Workout[] {
  const paces = settings.fiveKSeconds ? repPaces(settings.fiveKSeconds) : undefined
  return week.days.flatMap((day) => {
    if (day.type === 'rest') return []
    const date = addDaysTo(monday, WEEKDAYS.indexOf(day.weekday))
    return [
      {
        category: 'WORKOUT',
        type: 'Run',
        start_date_local: `${date}T00:00:00`,
        name:
          day.type === 'subT' ? repFormatLabel(day.session.repFormat) : DAY_TYPE_LABELS[day.type],
        description: workoutText(day, paces),
        external_id: `${EXTERNAL_ID_PREFIX}${date}`,
      },
    ]
  })
}

function workoutText(day: Exclude<Day, { type: 'rest' }>, paces?: RepPaces) {
  if (day.type !== 'subT') return `- ${day.minutes}m ${EASY_HR}`

  const { session } = day
  const { reps, repMinutes, repLength } = session.repFormat

  const rep = `- ${repMinutes}m${paces ? ` ${formatRepPace(paces[repLength])}/km Pace` : ''}`

  return [
    'Warmup',
    `- ${session.warmUpMinutes}m ${EASY_HR} press lap`,
    '',
    `${reps - 1}x`,
    rep,
    `- ${session.recoveryMinutes}m`,
    '',
    rep,
    '',
    'Cooldown',
    `- ${session.coolDownMinutes}m ${EASY_HR}`,
  ].join('\n')
}
