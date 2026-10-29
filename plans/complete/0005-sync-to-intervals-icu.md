---
created: 2026-10-06
---

# Sync to intervals.icu

## Goal

In the user's words: "Let's set up intervals.icu syncing. It can be on demand for now", then "massively simplify this, and just show one week in the app with a sync button. That sync button will allow the user to select which week to add this to in intervals.icu".

So: the app shows one undated Week. A "Sync to intervals.icu" button opens a dialog where the runner picks any calendar week (current or later) on a calendar, and Sync replaces every Managed Workout in that calendar week with the Week's runs. The user chose the word Sync over Schedule/Export because real ongoing syncing is planned later.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. TanStack Start (React 19), Tailwind v4, shadcn/ui (`components.json`, primitives in `src/components/ui/`: button, card, dropdown-menu, input, label, popover, select, tabs - no dialog, calendar or toast yet), Drizzle on Postgres, Better Auth, Vitest, zod. Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm dev` (port 3000), `pnpm db:generate` (drizzle-kit writes a migration from `src/db/schema.ts` into `drizzle/`; never hand-edit `drizzle/`), `pnpm db:migrate` (needs `.env`; `.env.example` lists `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`).
- Glossary `CONTEXT.md` was updated in this planning session and is already the target state for **Week** (undated), **Shuffle** (no Monday date), **Session Choice** (per weekday, not per Week), **Sync**, **Managed Workout** and **intervals.icu Connection**. Use those terms in code, UI and docs and respect the `_Avoid_` lists (e.g. never "export", "schedule", "upload" for Sync; never "SubT" in prose). Its opening line still says Sync "is planned but not built" - update it in the last step.
- ADRs: `docs/adr/0003-session-choices-on-derived-weeks.md` describes Weeks derived per Monday with Session Choices keyed by Week. The user declined a new ADR for the undated Week; leave the ADRs as they are.
- Planner `src/planner/planner.ts`:
  - `deriveWeek(settings, monday, sessionChoices)` seeds `createRandom(\`${settings.shuffle}:${monday}\`)`; `summarise(settings, monday, days)` puts `monday` on the returned `Week`. `deadSessionChoices(settings, monday, choices)` re-derives to find choices that no longer apply.
  - `Day` is `{ weekday } & ({ type: 'subT'; session; plannerRepFormat } | { type: 'easy'; minutes } | { type: 'long'; minutes } | { type: 'rest'; merged? })`.
  - `SubThresholdSession { repFormat, warmUpMinutes, coolDownMinutes, workMinutes, recoveryMinutes, minutes }`; there are `reps - 1` recoveries (`toSession`). `RECOVERY_MINUTES` is in `src/planner/rep-formats.ts`.
  - `src/planner/rep-paces.ts`: `repPaces(fiveKSeconds)` returns `{ fast, slow }` seconds per km per Rep Length; `formatDuration(seconds)` gives `m:ss`. `PlanSettings.fiveKSeconds` is nullable.
  - `src/planner/planner.test.ts` iterates `mondays = ['2026-09-28', ...]` and calls `deriveWeek(s, monday, ...)` throughout.
- Session Choices: table `session_choices` in `src/db/schema.ts`, PK (`userId`, `monday`, `weekday`); `src/session-choices/session-choices.server.ts` (`findSessionChoices`, `upsertSessionChoice`, `deleteSessionChoices`, `deleteDeadSessionChoices` - groups by Monday); `src/session-choices/session-choices.functions.ts` (server fns with a `monday` field in the zod schema). `src/plan-settings/plan-settings.functions.ts` `savePlanSettings` calls `deleteDeadSessionChoices` in a transaction.
- UI: `src/routes/index.tsx` renders "This week"/"Next week" tabs (lines ~369-395) using `mondayOf` from `src/lib/week-dates.ts`, and `chooseSession(monday, weekday, repFormat)`. `src/components/week-view.tsx` takes a `monday` prop, shows `dayOfMonth(week.monday, i)` dates in day cells, and has the Reshuffle icon button (~line 91). `src/routes/how-it-works.tsx` lines ~157-158 and ~255-257 describe Weeks varying by Monday date.
- Auth: `src/auth/auth.server.ts` exports `requireUserId()`.
- intervals.icu API facts (researched 2026-10-06 from https://intervals.icu/api/v1/docs and forum.intervals.icu; not yet tested live):
  - Auth: HTTP Basic, username `API_KEY`, password = the key. Athlete id `0` means the key's owner. Rate limit 5000/day per key.
  - List: `GET https://intervals.icu/api/v1/athlete/0/events?oldest=YYYY-MM-DD&newest=YYYY-MM-DD&category=WORKOUT` (`newest` inclusive). Returns all events, each with `id` and `external_id`.
  - Delete: `PUT /api/v1/athlete/0/events/bulk-delete` with body `[{ "id": 123 }, ...]`. Deleting by `external_id` and `upsert=true` only work for OAuth apps, not API keys - so match `external_id` client-side and delete by `id`. `external_id` is still stored and returned for API-key-created events.
  - Create: `POST /api/v1/athlete/0/events/bulk` with an array of `{ category: "WORKOUT", type: "Run", start_date_local: "2026-10-12T00:00:00", name, description, external_id }`. `type` is required when `description` holds workout text.
  - Workout text: steps `- 7m 4:05-4:15/km Pace`; a step with no target is just `- 15m`; repeats are a `3x` line directly above the repeated steps with a blank line before and after the block; `Warmup` / `Cooldown` header lines label sections.
  - Pace targets reportedly reach a Garmin only if the athlete has a threshold pace set in intervals.icu - out of scope.
- User constraints (global): YAGNI; comments only where they earn their place; plain "-" never em dashes in new prose and code; commit messages are a concise title only; ask before pushing or commenting on GitHub.

## Decisions

- **One undated Week.** The app shows a single Week derived from Plan Settings plus Session Choices only. Variety between Weeks comes from the runner pressing Reshuffle between Syncs, not from a Monday date. Rejected: keeping Monday-dated Weeks and re-deriving for the picked week (what you see would not be what you Sync).
- **Session Choices keyed by weekday only.** PK (`userId`, `weekday`). Existing rows are all deleted in the migration (they were picks for specific calendar weeks).
- **The Week view shows weekday labels only**, no dates, and no This/Next week tabs.
- **intervals.icu Connection is the API key only** (athlete id `0`), stored server-side per user, encrypted at rest (AES-256-GCM via `node:crypto`) with a new env secret. Rejected: browser-only storage (re-entry per device). Not part of Plan Settings.
- **The key is entered in the Sync dialog**: an "intervals.icu API key" field, required the first time, afterwards shown as saved with a "Change" link revealing the field again. No separate settings surface. The key is saved only after a Sync succeeds with it, so a mistyped key is never stored.
- **Sync runs on the server** (a server fn), deriving the Week from stored Plan Settings and Session Choices. Since the client autosaves Plan Settings 600 ms after a change, the Sync button should be disabled while a save is pending so the server derives what is on screen.
- **Sync always replaces the whole calendar week** (Mon-Sun), past days included. Steps: list the week's WORKOUT events, delete those whose `external_id` starts with `nsm-`, then bulk-create the new ones. Not atomic: if create fails after delete, the error shows and pressing Sync again recovers. Workouts the runner deleted in intervals.icu stay deleted until the next Sync; that is how they remove a workout. Everything not ours is untouched.
- **`external_id`** is `nsm-<date>`, e.g. `nsm-2026-10-12` (one workout per day). Rejected: a visible tag (editable by the runner, causing duplicates).
- **Rest Days create nothing.**
- **Workout names**: "Easy", "Sub-threshold", "Long". All-day: `start_date_local` `<date>T00:00:00`. `type: "Run"`, `category: "WORKOUT"`.
- **Workout text**: no `intensity=` tags anywhere. Warm-up, cool-down, Easy Run, Long Run and recoveries are duration-only steps with no target. Reps carry the Rep Pace range as absolute pace `<fast>-<slow>/km Pace` using `formatDuration`; with no 5K Time, reps are duration-only too. A Sub-threshold Session with reps N, rep minutes R, recovery C becomes (recoveries are `reps - 1`, so the last rep sits outside the repeat):

  ```
  Warmup
  - 15m

  3x
  - 7m 4:05-4:15/km Pace
  - 1m

  - 7m 4:05-4:15/km Pace

  Cooldown
  - 10m
  ```

  Easy and Long Runs are a single `- 45m` step.
- **Dialog** (from the user's screenshot, trimmed): title "Sync Week"; a two-month calendar (Monday-first) where hovering or clicking selects a whole Mon-Sun week; weeks before the current one disabled, no upper limit; a label of the selected week's dates (e.g. "12 - 18 Oct 2026"); the API key field; Cancel and "Sync" buttons. Dropped: the "Schedule to: intervals.icu" checkbox, the per-day preview, "Clear Selection".
- **Button** in the Week view next to Reshuffle: "Sync to intervals.icu".
- **Errors**: a 401 shows "intervals.icu rejected the API key" (or similar) in the dialog; any other failure shows its error in the dialog, which stays open for retry. On success the dialog closes and a toast says e.g. "Synced to 12-18 Oct".
- **No Sync history, no last-synced status, no drift detection.** Explicitly dropped by the user for now.

## Steps

- [x] Make the Week undated in the planner: remove the `monday` parameter from `deriveWeek` and `deadSessionChoices` and the `monday` field from `Week`; seed with `String(settings.shuffle)`. Update `planner.test.ts`: drop the `mondays` loop, and replace the "differs by date" test (~line 162) with one that Reshuffle (a different `shuffle`) changes the Week. Run `pnpm test`.
- [x] Re-key Session Choices by weekday: drop `monday` from the `session_choices` table and PK (`userId`, `weekday`) in `src/db/schema.ts`, and from `session-choices.server.ts` / `.functions.ts` (`deleteDeadSessionChoices` becomes a single `deadSessionChoices` call). Run `pnpm db:generate`; make the generated migration delete existing rows before changing the PK - if drizzle-kit cannot express that, generate a custom migration with `pnpm drizzle-kit generate --custom` and put the `DELETE` there, rather than hand-editing generated SQL.
- [x] UI to one Week: in `src/routes/index.tsx` remove the This/Next week tabs and `mondayOf` usage, render one `WeekView`; in `week-view.tsx` drop the `monday` prop and day-cell dates. Delete `src/lib/week-dates.ts` if unused. Update `how-it-works.tsx` (~157-158, ~255-257) so it no longer says Weeks vary by Monday date: Reshuffle gives a fresh Week.
- [x] Workout text: a pure function (e.g. `src/sync/workouts.ts`) from `(week: Week, settings: PlanSettings, firstDate: string)` to the intervals.icu event bodies per the Decisions. Unit-test it: names, dates, `external_id`, rest days skipped, a Sub-threshold Session's text with and without a 5K Time, 1-rep edge if any format has a single rep (check `REP_FORMATS`).
- [x] intervals.icu Connection storage: table `intervals_connections` (`userId` PK FK cascade, `apiKeyEncrypted` text, `updatedAt`); encrypt/decrypt helpers using a new env var (e.g. `INTERVALS_KEY_SECRET`, 32 bytes base64) added to `.env.example` and the README setup; `pnpm db:generate`.
- [x] Sync server fn (e.g. `src/sync/sync.functions.ts` + `sync.server.ts`): input `{ monday: z.iso.date(), apiKey?: string }`; reject Mondays before the current week; use the given key or the stored one (error if neither); derive the Week from stored settings and choices; list, delete ours by `id`, bulk-create; on success store the key if one was given. Map a 401 to a key error. A small `getIntervalsConnection` server fn returns whether a key is stored (never the key).
- [x] Dialog UI: add shadcn `dialog`, `calendar` and `sonner` (`pnpm dlx shadcn@latest add dialog calendar sonner`), mount the `Toaster` in `src/routes/__root.tsx`. Build the Sync dialog per the Decisions, with the button beside Reshuffle, disabled while a Plan Settings save is pending.
- [x] Update `CONTEXT.md`'s opening line (Sync is built, on demand) and the README if it describes features or env vars.
- [x] Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`.

## Verification

- `pnpm test`, `pnpm typecheck`, `pnpm lint` pass.
- `pnpm dev`, sign in, open the Sync dialog with a real intervals.icu API key, pick next week, Sync. In intervals.icu that week shows "Sub-threshold", "Easy" and "Long" workouts on the right days with structured steps and absolute paces on reps (if a 5K Time is set), nothing on Rest Days, and any pre-existing manual workouts untouched.
- Reshuffle and Sync the same week again: the old app workouts are replaced, not duplicated.
- Delete one app workout in intervals.icu, then Sync again: it comes back.
- A wrong key shows the key error and is not stored; the dialog remembers a working key after reload.
- Weeks before the current one cannot be picked.

## Open questions

- Unverified API behaviour to confirm on the first live Sync: that `external_id` round-trips on API-key events, that bulk-delete by `id` works with an API key, and how the duration-only recovery step renders in intervals.icu and on a watch.
