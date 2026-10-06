import { integer, jsonb, pgTable, primaryKey, text, timestamp } from 'drizzle-orm/pg-core'
import type { PlanSettings, Weekday } from '@/planner/planner'
import type { RepLength } from '@/planner/rep-formats'
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

export const sessionChoices = pgTable(
  'session_choices',
  {
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    weekday: text('weekday').$type<Weekday>().notNull(),
    repLength: text('rep_length').$type<RepLength>().notNull(),
    reps: integer('reps').notNull(),
    repMinutes: integer('rep_minutes').notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
  },
  (t) => [primaryKey({ columns: [t.userId, t.weekday] })],
)

export const intervalsConnections = pgTable('intervals_connections', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  apiKeyEncrypted: text('api_key_encrypted').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})
