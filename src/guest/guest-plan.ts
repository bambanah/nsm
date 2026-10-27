import { z } from 'zod'
import { guestPlanSchema } from '@/planner/schemas'

const KEY = 'guestPlan'

export type GuestPlan = z.infer<typeof guestPlanSchema>

export function loadGuestPlan(): GuestPlan | null {
  try {
    return guestPlanSchema.parse(JSON.parse(localStorage.getItem(KEY) ?? 'null'))
  } catch {
    return null
  }
}

export function saveGuestPlan(plan: GuestPlan) {
  try {
    localStorage.setItem(KEY, JSON.stringify(plan))
  } catch {}
}

export function clearGuestPlan() {
  try {
    localStorage.removeItem(KEY)
  } catch {}
}
