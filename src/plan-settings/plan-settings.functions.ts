import { createServerFn } from '@tanstack/react-start'
import { requireUserId } from '@/auth/auth.server'
import { db } from '@/db/db.server'
import { sessionChoiceError } from '@/planner/planner'
import { guestPlanSchema, planSettingsSchema } from '@/planner/schemas'
import { validatePlanSettings } from '@/planner/validate'
import {
  deleteDeadSessionChoices,
  upsertSessionChoice,
} from '@/session-choices/session-choices.server'
import { findPlanSettings, upsertPlanSettings } from './plan-settings.server'

export const getPlanSettings = createServerFn({ method: 'GET' }).handler(async () =>
  findPlanSettings(await requireUserId()),
)

export const savePlanSettings = createServerFn({ method: 'POST' })
  .validator(planSettingsSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const errors = validatePlanSettings(data)
    if (errors.length > 0) throw new Error(errors.map((e) => e.message).join(', '))
    await db.transaction(async (tx) => {
      await upsertPlanSettings(userId, data, tx)
      await deleteDeadSessionChoices(userId, data, tx)
    })
  })

export const adoptGuestPlan = createServerFn({ method: 'POST' })
  .validator(guestPlanSchema)
  .handler(async ({ data: { settings, sessionChoices } }) => {
    const userId = await requireUserId()
    if (validatePlanSettings(settings).length > 0) return
    await db.transaction(async (tx) => {
      if (await findPlanSettings(userId, tx)) return
      await upsertPlanSettings(userId, settings, tx)
      for (const choice of sessionChoices) {
        if (!sessionChoiceError(settings, choice)) await upsertSessionChoice(userId, choice, tx)
      }
    })
  })
