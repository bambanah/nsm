import { createServerFn } from '@tanstack/react-start'
import { requireUserId } from '@/auth/auth.server'
import { findPlanSettings } from '@/plan-settings/plan-settings.server'
import { sessionChoiceError } from '@/planner/planner'
import { sessionChoiceSchema, weekdaySchema } from '@/planner/schemas'
import {
  deleteSessionChoices,
  findSessionChoices,
  upsertSessionChoice,
} from './session-choices.server'

export const getSessionChoices = createServerFn({ method: 'GET' }).handler(async () =>
  findSessionChoices(await requireUserId()),
)

export const setSessionChoice = createServerFn({ method: 'POST' })
  .validator(sessionChoiceSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const settings = await findPlanSettings(userId)
    if (!settings) throw new Error('Save Plan Settings first')
    const error = sessionChoiceError(settings, data)
    if (error) throw new Error(error)
    await upsertSessionChoice(userId, data)
  })

export const deleteSessionChoice = createServerFn({ method: 'POST' })
  .validator(weekdaySchema)
  .handler(async ({ data }) => deleteSessionChoices(await requireUserId(), [data.weekday]))
