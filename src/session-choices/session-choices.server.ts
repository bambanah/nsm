import { and, eq, or } from 'drizzle-orm'
import { db, type Executor } from '@/db/db.server'
import { sessionChoices } from '@/db/schema'
import { deadSessionChoices, type PlanSettings, type SessionChoice } from '@/planner/planner'

export type WeekSessionChoice = SessionChoice & { monday: string }

export async function findSessionChoices(
  userId: string,
  executor: Executor = db,
): Promise<WeekSessionChoice[]> {
  const rows = await executor.select().from(sessionChoices).where(eq(sessionChoices.userId, userId))
  return rows.map(({ monday, weekday, repLength, reps, repMinutes }) => ({
    monday,
    weekday,
    repFormat: { repLength, reps, repMinutes },
  }))
}

export async function upsertSessionChoice(userId: string, choice: WeekSessionChoice) {
  const values = { ...choice.repFormat, updatedAt: new Date() }
  await db
    .insert(sessionChoices)
    .values({ userId, monday: choice.monday, weekday: choice.weekday, ...values })
    .onConflictDoUpdate({
      target: [sessionChoices.userId, sessionChoices.monday, sessionChoices.weekday],
      set: values,
    })
}

export async function deleteSessionChoices(
  userId: string,
  choices: Pick<WeekSessionChoice, 'monday' | 'weekday'>[],
  executor: Executor = db,
) {
  if (choices.length === 0) return
  await executor
    .delete(sessionChoices)
    .where(
      and(
        eq(sessionChoices.userId, userId),
        or(
          ...choices.map((c) =>
            and(eq(sessionChoices.monday, c.monday), eq(sessionChoices.weekday, c.weekday)),
          ),
        ),
      ),
    )
}

export async function deleteDeadSessionChoices(
  userId: string,
  settings: PlanSettings,
  executor: Executor = db,
) {
  const choices = await findSessionChoices(userId, executor)
  const mondays = new Set(choices.map((c) => c.monday))
  const dead = [...mondays].flatMap((monday) =>
    deadSessionChoices(
      settings,
      monday,
      choices.filter((c) => c.monday === monday),
    ),
  )
  await deleteSessionChoices(userId, dead, executor)
}
