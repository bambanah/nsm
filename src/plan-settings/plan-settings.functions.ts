import { createServerFn } from '@tanstack/react-start'
import { requireUserId } from '@/auth/auth.server'
import { db } from '@/db/db.server'
import { planningState } from '@/planner/planning-state'
import { planningStateSchema, planSettingsSchema } from '@/planner/schemas'
import { findSessionChoices, replaceSessionChoices } from '@/session-choices/session-choices.server'
import { findPlanSettings, upsertPlanSettings } from './plan-settings.server'

export const getPlanSettings = createServerFn({ method: 'GET' }).handler(async () =>
  findPlanSettings(await requireUserId()),
)

export const savePlanSettings = createServerFn({ method: 'POST' })
  .validator(planSettingsSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    await db.transaction(async (tx) => {
      const state = planningState(data, await findSessionChoices(userId, tx))
      await upsertPlanSettings(userId, state.settings, tx)
      await replaceSessionChoices(userId, state.sessionChoices, tx)
    })
  })

export const adoptGuestPlanningState = createServerFn({ method: 'POST' })
  .validator(planningStateSchema)
  .handler(async ({ data: { settings, sessionChoices } }) => {
    const userId = await requireUserId()
    let state
    try {
      state = planningState(settings, sessionChoices)
    } catch {
      return
    }
    await db.transaction(async (tx) => {
      if (await findPlanSettings(userId, tx)) return
      await upsertPlanSettings(userId, state.settings, tx)
      await replaceSessionChoices(userId, state.sessionChoices, tx)
    })
  })
