import { and, eq, inArray } from 'drizzle-orm'
import { db, type Executor } from '@/db/db.server'
import { sessionChoices } from '@/db/schema'
import {
  deadSessionChoices,
  type PlanSettings,
  type SessionChoice,
  type Weekday,
} from '@/planner/planner'

export async function findSessionChoices(
  userId: string,
  executor: Executor = db,
): Promise<SessionChoice[]> {
  const rows = await executor.select().from(sessionChoices).where(eq(sessionChoices.userId, userId))
  return rows.map(({ weekday, repLength, reps, repMinutes }) => ({
    weekday,
    repFormat: { repLength, reps, repMinutes },
  }))
}

export async function upsertSessionChoice(userId: string, choice: SessionChoice) {
  const values = { ...choice.repFormat, updatedAt: new Date() }
  await db
    .insert(sessionChoices)
    .values({ userId, weekday: choice.weekday, ...values })
    .onConflictDoUpdate({
      target: [sessionChoices.userId, sessionChoices.weekday],
      set: values,
    })
}

export async function deleteSessionChoices(
  userId: string,
  weekdays: Weekday[],
  executor: Executor = db,
) {
  if (weekdays.length === 0) return
  await executor
    .delete(sessionChoices)
    .where(and(eq(sessionChoices.userId, userId), inArray(sessionChoices.weekday, weekdays)))
}

export async function deleteDeadSessionChoices(
  userId: string,
  settings: PlanSettings,
  executor: Executor = db,
) {
  const dead = deadSessionChoices(settings, await findSessionChoices(userId, executor))
  await deleteSessionChoices(
    userId,
    dead.map((c) => c.weekday),
    executor,
  )
}
