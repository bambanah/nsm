import {
  deriveWeek,
  exceedsSessionCap,
  type PlanSettings,
  type SessionChoice,
  type Weekday,
} from './planner'
import { REP_FORMATS, type RepFormat } from './rep-formats'
import { validatePlanSettings } from './validate'

export interface PlanningState {
  settings: PlanSettings
  sessionChoices: SessionChoice[]
}

export function planningState(
  settings: PlanSettings,
  sessionChoices: SessionChoice[],
): PlanningState {
  const errors = validatePlanSettings(settings)
  if (errors.length > 0) throw new Error(errors.map((e) => e.message).join(', '))
  return {
    settings,
    sessionChoices: sessionChoices.filter((c) => !sessionChoiceError(settings, c)),
  }
}

export function withSessionChoice(
  state: PlanningState,
  weekday: Weekday,
  repFormat?: RepFormat,
): PlanningState {
  const others = state.sessionChoices.filter((c) => c.weekday !== weekday)
  if (!repFormat) return { ...state, sessionChoices: others }
  const error = sessionChoiceError(state.settings, { weekday, repFormat })
  if (error) throw new Error(error)
  return { ...state, sessionChoices: [...others, { weekday, repFormat }] }
}

function sessionChoiceError(settings: PlanSettings, { weekday, repFormat }: SessionChoice) {
  const { repLength, reps, repMinutes } = repFormat
  const known = REP_FORMATS.some(
    (f) => f.repLength === repLength && f.reps === reps && f.repMinutes === repMinutes,
  )
  if (!known) return 'Unknown Rep Format'
  const day = deriveWeek(settings).days.find((d) => d.weekday === weekday)
  if (day?.type !== 'subT' || exceedsSessionCap(repFormat, settings.weeklyDurationMinutes))
    return 'That Rep Format does not fit this day'
}
