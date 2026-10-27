import {
  boolean,
  date,
  index,
  integer,
  jsonb,
  pgTable,
  primaryKey,
  serial,
  text,
  timestamp,
} from 'drizzle-orm/pg-core'
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

export const scheduledSyncs = pgTable('scheduled_syncs', {
  userId: text('user_id')
    .primaryKey()
    .references(() => user.id, { onDelete: 'cascade' }),
  enabled: boolean('enabled').notNull(),
  weekday: text('weekday').$type<Weekday>().notNull(),
  hour: integer('hour').notNull(),
  timeZone: text('time_zone').notNull(),
  savedAt: timestamp('saved_at').notNull(),
  updatedAt: timestamp('updated_at').defaultNow().notNull(),
})

export const syncRecords = pgTable(
  'sync_records',
  {
    id: serial('id').primaryKey(),
    userId: text('user_id')
      .notNull()
      .references(() => user.id, { onDelete: 'cascade' }),
    ranAt: timestamp('ran_at').notNull(),
    monday: date('monday').notNull(),
    trigger: text('trigger').$type<'manual' | 'scheduled'>().notNull(),
    outcome: text('outcome').$type<'succeeded' | 'failed' | 'skipped'>().notNull(),
    error: text('error'),
  },
  (t) => [index('sync_records_user_id_ran_at_idx').on(t.userId, t.ranAt)],
)
