import { planningState, type PlanningState } from '@/planner/planning-state'
import { planningStateSchema } from '@/planner/schemas'

const KEY = 'guestPlan'

export function loadGuestPlanningState(): PlanningState | null {
  try {
    const parsed = planningStateSchema.parse(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
    return planningState(parsed.settings, parsed.sessionChoices)
  } catch {
    return null
  }
}

export function saveGuestPlanningState(state: PlanningState) {
  try {
    localStorage.setItem(KEY, JSON.stringify(state))
  } catch {}
}

export function clearGuestPlanningState() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
