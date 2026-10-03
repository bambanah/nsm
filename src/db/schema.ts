import { integer, jsonb, pgTable, text, timestamp } from 'drizzle-orm/pg-core'
import type { PlanSettings } from '@/planner/planner'
import { user } from './auth-schema'

export * from './auth-schema'

export const planSettings = pgTable('plan_settings', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  weeklyDurationMinutes: integer('weekly_duration_minutes').notNull(),
  warmUpMinutes: integer('warm_up_minutes').notNull(),
  coolDownMinutes: integer('cool_down_minutes').notNull(),
  dayPreferences: jsonb('day_preferences').$type<PlanSettings['dayPreferences']>().notNull(),
  shuffle: integer('shuffle').notNull(),
  fiveKSeconds: integer('five_k_seconds'),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
