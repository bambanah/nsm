import { eq } from 'drizzle-orm'
import { db, type Executor } from '@/db/db.server'
import { planSettings } from '@/db/schema'
import type { PlanSettings } from '@/planner/planner'

export async function findPlanSettings(userId: string): Promise<PlanSettings | null> {
  const [row] = await db
    .select({
      weeklyDurationMinutes: planSettings.weeklyDurationMinutes,
      warmUpMinutes: planSettings.warmUpMinutes,
      coolDownMinutes: planSettings.coolDownMinutes,
      dayPreferences: planSettings.dayPreferences,
      shuffle: planSettings.shuffle,
      fiveKSeconds: planSettings.fiveKSeconds,
    })
    .from(planSettings)
    .where(eq(planSettings.userId, userId))
  return row ?? null
}

export async function upsertPlanSettings(
  userId: string,
  settings: PlanSettings,
  executor: Executor = db,
) {
  const values = { ...settings, updatedAt: new Date() }
  await executor
    .insert(planSettings)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: planSettings.userId, set: values })
}
