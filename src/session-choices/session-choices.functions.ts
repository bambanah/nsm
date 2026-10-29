import { createServerFn } from '@tanstack/react-start'
import { requireUserId } from '@/auth/auth.server'
import { db } from '@/db/db.server'
import { upsertPlanSettings } from '@/plan-settings/plan-settings.server'
import { planningState, withSessionChoice } from '@/planner/planning-state'
import { chooseSessionSchema } from '@/planner/schemas'
import { findSessionChoices, replaceSessionChoices } from './session-choices.server'

export const getSessionChoices = createServerFn({ method: 'GET' }).handler(async () =>
  findSessionChoices(await requireUserId()),
)

export const chooseSession = createServerFn({ method: 'POST' })
  .validator(chooseSessionSchema)
  .handler(async ({ data: { settings, weekday, repFormat } }) => {
    const userId = await requireUserId()
    await db.transaction(async (tx) => {
      const stored = await findSessionChoices(userId, tx)
      const state = withSessionChoice(planningState(settings, stored), weekday, repFormat)
      await upsertPlanSettings(userId, state.settings, tx)
      await replaceSessionChoices(userId, state.sessionChoices, tx)
    })
  })
