import { createServerFn } from '@tanstack/react-start'
import { z } from 'zod'
import { requireUserId } from '@/auth/auth.server'
import { findPlanSettings } from '@/plan-settings/plan-settings.server'
import { deadSessionChoices, WEEKDAYS } from '@/planner/planner'
import { REP_FORMATS, REP_LENGTHS } from '@/planner/rep-formats'
import {
  deleteSessionChoices,
  findSessionChoices,
  upsertSessionChoice,
} from './session-choices.server'

const weekDaySchema = z.object({
  monday: z.iso.date(),
  weekday: z.enum(WEEKDAYS),
})

const sessionChoiceSchema = weekDaySchema.extend({
  repFormat: z.object({
    repLength: z.enum(REP_LENGTHS),
    reps: z.int(),
    repMinutes: z.int(),
  }),
})

export const getSessionChoices = createServerFn({ method: 'GET' }).handler(async () =>
  findSessionChoices(await requireUserId()),
)

export const setSessionChoice = createServerFn({ method: 'POST' })
  .validator(sessionChoiceSchema)
  .handler(async ({ data }) => {
    const userId = await requireUserId()
    const { repLength, reps, repMinutes } = data.repFormat
    const known = REP_FORMATS.some(
      (f) => f.repLength === repLength && f.reps === reps && f.repMinutes === repMinutes,
    )
    if (!known) throw new Error('Unknown Rep Format')
    const settings = await findPlanSettings(userId)
    if (!settings) throw new Error('Save Plan Settings first')
    if (deadSessionChoices(settings, data.monday, [data]).length > 0)
      throw new Error('That Rep Format does not fit this day')
    await upsertSessionChoice(userId, data)
  })

export const deleteSessionChoice = createServerFn({ method: 'POST' })
  .validator(weekDaySchema)
  .handler(async ({ data }) => deleteSessionChoices(await requireUserId(), [data]))
