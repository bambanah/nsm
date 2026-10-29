---
created: 2026-10-27
---

# Scheduled Sync and Sync History

## Goal

In the user's words: "I want to auto sync on a schedule and store sync history for intervals.icu. We can allow the user to specify a day and time to sync weekly."

So: a signed-in runner with a saved intervals.icu API key can turn on a **Scheduled Sync** at a weekly **Sync Time** (weekday + whole hour, in their timezone), and every Sync, manual or scheduled, leaves a **Sync Record** they can see in the Sync dialog.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. TanStack Start (React, `@tanstack/react-start`) on Nitro (`nitro` 3 beta, wired in `vite.config.ts` via `nitro()`), Tailwind v4, shadcn/ui, better-auth, Drizzle on Postgres, zod, date-fns v4, sonner, Vitest, Playwright. Deployed as one Docker container on Coolify (`Dockerfile`, `node .output/server/index.mjs`), so an in-process scheduler runs exactly once.
- Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm dev` (port 3000), `pnpm test:e2e` (needs Postgres on `localhost:5434`, see README). After changing `src/db/schema.ts`, run `pnpm db:generate` and commit the new migration in `drizzle/`.
- Read first: `GLOSSARY.md` (section "Sync": **Sync**, **Managed Workout**, **Scheduled Sync**, **Sync Time**, **Sync Record**, **intervals.icu Connection**; use these terms in code and UI and never the `_Avoid_` words, e.g. never "auto sync", "cron", "log", "schedule" as a noun for the Sync Time). The glossary was updated in the planning session and is already the target state. `docs/adr/0004-guests-plan-on-device.md` (Guests never touch the db or intervals.icu). `plans/complete/0005-sync-to-intervals-icu.md` (how manual Sync was built).
- Current Sync code:
  - `src/sync/sync.functions.ts`: server fn `syncWeek({ monday, apiKey? })`. Requires sign-in, rejects Mondays more than a week before the server's current Monday, takes the API key from input or `findApiKey`, requires Plan Settings (`findPlanSettings`), derives the Week with `deriveWeek(settings, await findSessionChoices(userId))`, calls `replaceManagedWorkouts(apiKey, monday, workouts(week, settings, monday))`, then saves a newly entered key. Records nothing. `getIntervalsConnection` returns `{ hasApiKey }`.
  - `src/sync/intervals.server.ts`: `replaceManagedWorkouts` throws `Error`s with runner-readable messages ("intervals.icu rejected the API key", "intervals.icu failed (status): body"). These messages are what a failed Sync Record stores.
  - `src/sync/intervals-connection.server.ts`: `findApiKey` (null if missing or undecryptable), `hasApiKey`, `saveApiKey`.
  - `src/lib/week-dates.ts`: `mondayOf`, `addDaysTo`, `parseDate`, `isoDate`, `weekLabel`. All use the server's local time; nothing is timezone-aware yet.
  - `src/components/sync-dialog.tsx`: `SyncDialog({ week, hasApiKey, disabled, isGuest })`. Guests get a disabled button with a sign-in popover. Otherwise a dialog titled "Sync Week" with a two-month week-picking calendar, an activities preview, the API key field ("Saved · Change"), an error line and Cancel / Sync buttons. After a successful Sync it toasts and calls `router.invalidate()`.
  - `src/routes/index.tsx`: the loader calls `getIntervalsConnection()` for signed-in runners and passes `hasApiKey` down through `WeekView` to `SyncDialog`.
- Schema `src/db/schema.ts`: `plan_settings`, `session_choices`, `intervals_connections`, all keyed by `user_id` with `onDelete: 'cascade'` to `user`. Follow the same pattern.
- Nitro scheduled tasks: documented in `node_modules/nitro/dist/docs/0.docs/13.tasks.md`. They need `experimental: { tasks: true }` plus `scheduledTasks: { '0 * * * *': ['<task name>'] }` and a `defineTask` in `tasks/<name>.ts`. The `node_server` preset and `dev` run them with croner. Check how the `nitro()` Vite plugin in `vite.config.ts` takes this config (inline options or a `nitro.config.ts`) and which directory it scans for `tasks/`, then confirm a task actually fires under `pnpm dev`.
- Repo rules (`/Users/lachlanunderhill/.claude/CLAUDE.md`, `CLAUDE.md`): YAGNI, minimal comments, plain "-" not em dashes, commit titles only (commitlint conventional commits), ask before pushing or commenting on GitHub. PRs that change the UI attach before/after screenshots of the Sync dialog, saved outside the repo (`screenshots` skill).

## Decisions

All settled with the user. Do not reopen them.

1. **A weekly slot replaces the old window model.** The glossary used to define Weeks Ahead, Sync Window and Synced Week (a Scheduled Sync filling unsynced weeks ahead). These are removed and were never built. Scheduled Sync runs once a week at the runner's Sync Time.
2. **Target week**: a Scheduled Sync Syncs the calendar week that starts on the first Monday on or after the Sync Time, in the runner's timezone. A Monday Sync Time Syncs the current week. Any other day Syncs next week. Rejected: always next week, and a runner-chosen "this/next week".
3. **Manual wins**: a Scheduled Sync is skipped when its target calendar week already has a **successful Manual** Sync Record, whenever that was made. A failed manual Sync does not count. A previous successful *Scheduled* Sync of the same week does not cause a skip (e.g. the runner moved the Sync Time from Sunday to Monday). It Syncs again, which is harmless.
4. **Sync Time granularity** is weekday + whole hour (00:00-23:00). An hourly tick is enough.
5. **Timezone**: the browser's IANA timezone (`Intl.DateTimeFormat().resolvedOptions().timeZone`) is captured whenever the Sync Time is saved, stored with it, and shown next to it (e.g. "Sunday 18:00, Australia/Melbourne"). Re-saving updates it.
6. **Sync Records** are written for every attempted Sync of either trigger. Each stores when it ran, the calendar week (its Monday), trigger `manual` | `scheduled`, and outcome `succeeded` | `failed` (with the error message) | `skipped` (already Synced manually). Rejected: recording only Scheduled Syncs.
7. **Skips are recorded**, so the runner can see why nothing happened and the catch-up treats the slot as handled.
8. **Catch-up, no retries**: an hourly server tick finds each runner whose most recent Sync Time has passed with no Scheduled Sync Record since that moment, and runs it. This covers downtime. A failure is recorded and not retried. There are no emails or notifications.
9. **Only Sync Times after saving count**: a slot counts only if it is later than the moment the Sync Time was saved, changed or turned back on. Turning Scheduled Sync on never Syncs straight away.
10. **Off keeps the Sync Time**: turning Scheduled Sync off keeps the stored weekday, hour and timezone, so turning it back on restores them. Turning it back on resets the "saved at" moment for Decision 9.
11. **UI**: an opt-in toggle in the existing Sync dialog, off by default, with weekday and hour pickers and the timezone shown. The dialog also lists the last 10 Sync Records (date and time, calendar week via `weekLabel`, Manual/Scheduled, outcome and any error). Only signed-in runners with a saved API key can turn it on. Guests see nothing new.
12. **Retention**: Sync Records are kept for as long as the account exists and cascade-deleted with the user. There is no pruning.
13. No ADR: none of these decisions is hard to reverse.

## Steps

- [x] Schema in `src/db/schema.ts`:
  - `scheduled_syncs`: `user_id` pk, FK cascade. Columns `enabled` boolean, `weekday` (reuse the planner's `Weekday` type), `hour` int 0-23, `time_zone` text, `saved_at` timestamp (Decisions 9/10), `updated_at`.
  - `sync_records`: id pk, `user_id` FK cascade, `ran_at` timestamp, `monday` date text, `trigger`, `outcome`, `error` nullable. Index `(user_id, ran_at)`.
  - Run `pnpm db:generate` and commit the migration.
- [x] Timezone-aware date logic in a pure, unit-tested module (e.g. `src/sync/sync-time.ts`):
  - (a) `latestSyncTime(weekday, hour, timeZone, now)` returns the most recent slot instant at or before `now`.
  - (b) `targetMonday(slot, timeZone)` returns the ISO date of the first Monday on or after the slot's local date.
  - Use `@date-fns/tz` (`TZDate`, the date-fns v4 companion) or `Intl`. Pick one and add it if needed.
  - Tests: Monday and non-Monday slots, slots near midnight, a DST transition (e.g. `Australia/Melbourne` in early October and early April), and timezones ahead of and behind UTC.
- [x] Sync Record writes: factor the core of `syncWeek` into a server-only function (e.g. `runSync(userId, monday, trigger, apiKey?)` in `src/sync/sync.server.ts`). It resolves the key, Plan Settings and Session Choices, calls `replaceManagedWorkouts`, and inserts a `succeeded` or `failed` Sync Record (failed stores `error.message`). Missing API key or Plan Settings are failures too. `syncWeek` keeps its input validation (Monday check, sign-in), calls this function, and still throws the error to the dialog after recording it. A newly entered key is saved only on success, as today.
- [x] Scheduled Sync runner (e.g. `runDueScheduledSyncs(now)` in the same server module, unit- or integration-tested). For each enabled `scheduled_syncs` row:
  - Compute `slot = latestSyncTime(...)`.
  - If `slot > saved_at` and there is no `scheduled` Sync Record for the user with `ran_at >= slot`, compute `monday = targetMonday(slot)`.
  - If a `manual` + `succeeded` record exists for that Monday, insert a `skipped` record.
  - Otherwise call `runSync(userId, monday, 'scheduled')`.
  - One runner's failure must not stop the others.
- [x] Nitro task: enable tasks, register an hourly `'0 * * * *'` scheduled task that calls `runDueScheduledSyncs(new Date())`. Confirm it fires under `pnpm dev` (e.g. temporarily use a minute cron and watch for a Sync Record).
- [x] Server fns (in `src/sync/sync.functions.ts` or a sibling):
  - Extend the loader data for signed-in runners with the Scheduled Sync row (or null) and the last 10 Sync Records.
  - `saveScheduledSync({ enabled, weekday, hour, timeZone })`: zod-validated, requires sign-in and a saved API key to enable. Sets `saved_at = now` whenever it is enabled or its weekday, hour or timezone changes.
- [x] `src/components/sync-dialog.tsx`: add the Scheduled Sync section (toggle, weekday select, hour select, timezone label) and the Sync History list (last 10 records, newest first) per Decision 11. Disable the toggle with a hint when no API key is saved. `router.invalidate()` after saving and after a manual Sync, so the history refreshes. Pass the new loader data through `src/routes/index.tsx` and `WeekView`.
- [x] e2e in `e2e/app.spec.ts`:
  - Turning Scheduled Sync on and off persists across reload.
  - A manual Sync attempt appears in the history. Stub intervals.icu, or use a bad key to get a failed record, whichever the existing Sync e2e does. Check `e2e/app.spec.ts` first.
  - Guest tests in `e2e/guest.spec.ts` still pass.
- [x] Update `README.md`'s opening line ("Syncs it ... on demand") to mention Scheduled Sync.
- [x] Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`.

## Verification

- `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` all pass.
- Unit tests cover `latestSyncTime` / `targetMonday` edge cases and the runner's branches: not yet due, slot before `saved_at`, already ran since the slot, skipped for a manual Sync, succeeded, failed, and one failing runner not blocking another.
- Manually with `pnpm dev` and a real intervals.icu API key:
  - Turn on Scheduled Sync for the current hour's slot next week. No immediate Sync happens.
  - Temporarily lower the cron to every minute and set a Sync Time just ahead. When it passes, a Scheduled Sync Record appears and the Managed Workouts are in intervals.icu for the target week.
  - Manually Sync next week, then let a Scheduled Sync for next week fire. It records "skipped".
  - Stop the server across a Sync Time and restart. The next tick catches up once.
  - The history shows the last 10 records. Turn it off and on: the Sync Time is retained.

## Open questions

- Pre-existing mismatch, outside this plan: the glossary's **Sync** says it replaces Managed Workouts "from today on", leaving past days untouched. The code (`replaceManagedWorkouts`, and Decision in `plans/complete/0005-sync-to-intervals-icu.md`) replaces the whole Mon-Sun week. Scheduled Sync's target week never has past days when it runs, so this plan is unaffected. The user decides whether to change the code or the glossary.
