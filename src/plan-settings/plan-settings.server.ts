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

export async function updateShuffle(userId: string, shuffle: number) {
  const updated = await db
    .update(planSettings)
    .set({ shuffle, updatedAt: new Date() })
    .where(eq(planSettings.userId, userId))
    .returning({ shuffle: planSettings.shuffle })
  if (updated.length === 0) throw new Error('Save Plan Settings before reshuffling')
}
