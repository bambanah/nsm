import { eq } from 'drizzle-orm'
import { db, type Executor } from '@/db/db.server'
import { sessionChoices } from '@/db/schema'
import type { SessionChoice } from '@/planner/planner'

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

export async function replaceSessionChoices(
  userId: string,
  choices: SessionChoice[],
  executor: Executor = db,
) {
  await executor.delete(sessionChoices).where(eq(sessionChoices.userId, userId))
  if (choices.length === 0) return
  await executor
    .insert(sessionChoices)
    .values(choices.map(({ weekday, repFormat }) => ({ userId, weekday, ...repFormat })))
}
