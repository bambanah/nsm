import { eq } from 'drizzle-orm'
import { db } from '@/db/db.server'
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
    })
    .from(planSettings)
    .where(eq(planSettings.userId, userId))
  return row ?? null
}

export async function upsertPlanSettings(userId: string, settings: PlanSettings) {
  const values = { ...settings, updatedAt: new Date() }
  await db
    .insert(planSettings)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: planSettings.userId, set: values })
}
