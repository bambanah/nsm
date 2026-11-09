---
created: 2026-11-09
---

# Synced Week view

## Goal

The user's words: "On sunday, I wanted to go in and see what had just been synced for the next week. Being able to show what was synced is one way, but the sync should be a background process that is working well if it's set up once and then the user forgets it happens. They should be able to go in and see the most relevant information."

So when a signed-in runner opens the app (typically Sunday, after their Scheduled Sync), the first thing they see is the coming calendar week's runs with real dates, plus one line confirming the Sync worked. Once Sync is set up, the setup and history controls recede so they don't distract.

## Context

- Read `GLOSSARY.md` first and use its terms. **Synced Week** was added for this plan. ADRs live in `docs/adr/`. The relevant ones are 0001 (Weeks are derived, never stored) and 0005 (one undated Week; a Sync places it on a calendar week; a Scheduled Sync re-Syncs the same Week until the runner Reshuffles).
- Prior Sync work: `plans/complete/0005-sync-to-intervals-icu.md`, `plans/complete/0008-scheduled-sync-and-sync-history.md`.
- Main page: `src/routes/index.tsx`. It renders `WeekView` (`src/components/week-view.tsx`) with `syncState` and `syncDisabled` (true while Plan Settings are unsaved or differ from the saved ones).
- Sync UI: `src/components/sync-section.tsx` contains the status line ("Last Synced … · Next …"), the failed-attempt line, `ScheduledSyncSection`, `ApiKeySection` and the `SyncHistory` table. `src/components/sync-dialog.tsx` is the manual Sync button with its week picker.
- Server:
  - `src/sync/sync.server.ts`: `runSync(userId, monday, trigger)` derives the Week from the saved Planning State, builds `workouts(week, settings, monday)` (`src/sync/workouts.ts`), pushes with `replaceManagedWorkouts`, and inserts a Sync Record. It also contains `findLastSucceededSync` and `findSyncHistory`.
  - `src/sync/sync.functions.ts`: `getSyncState` returns `{ hasApiKey, scheduledSync, syncHistory, lastSync }`. `syncWeek` is the manual Sync server fn.
- Schema: `src/db/schema.ts`, table `syncRecords` (`id, userId, ranAt, monday, trigger, outcome, error`). Migrations in `drizzle/`: generate with `pnpm db:generate` after editing the schema (never hand-edit generated files), apply with `pnpm db:migrate`.
- Date helpers: `src/lib/week-dates.ts` (`mondayOf`, `addDaysTo`, `weekLabel`, `isoDate`, `parseDate`). Timezone helpers: `src/sync/sync-time.ts`.
- Commands: `pnpm dev`, `pnpm test` (vitest), `pnpm test:e2e` (Playwright; specs in `e2e/app.spec.ts`, `e2e/guest.spec.ts`), `pnpm typecheck`, `pnpm lint`, `pnpm format`.
- Constraints: YAGNI, so build only what's listed here. Pin any new dependency to an exact version. Follow `CLAUDE.md`: PRs that change the UI need before/after screenshots (`screenshots` skill).

## Decisions

- **The main job is to see the coming week's dated runs**, with confirmation that the Sync worked folded into a single line. Re-Syncing after a tweak stays possible but is secondary.
- **What the view shows comes from deriving the Week, not storing it.** The view shows the current derived Week against the Synced Week's dates. This is accurate because a Scheduled Sync re-Syncs the same Week until a Reshuffle or other Planning State change. Rejected alternatives:
  - storing a snapshot of the Synced Week on the Sync Record: this reverses ADR 0001.
  - reading Managed Workouts back from intervals.icu: an API call on every load, and the page breaks when intervals.icu is down.
- **Synced Week** = the calendar week of the latest successful Sync whose week hasn't ended yet. If several qualify (e.g. on Sunday, when both this week and next week are Synced), take the latest Monday. Examples:
  - Sunday after the Scheduled Sync: next week.
  - Mid-week: this week.
  - No qualifying Sync (last Sync was weeks ago): undated view, as today.
  - Guests: always undated.
  - Judge "hasn't ended" in the runner's local time.
- **Detect "changed since Sync" with a fingerprint.** Each successful Sync Record stores a fingerprint (hash) of what was pushed. Hash `workouts(week, settings, monday)`, because that covers paces and warm-up/cool-down as well as the Week's shape. If the fingerprint for the saved Planning State on the Synced Week differs from the stored one, the dated header shows "Differs from your calendar · Sync again". A fingerprint is not a stored Week, so ADR 0001 holds. Rejected: comparing timestamps, which gives a false alarm when a change is reverted. Records written before the migration have no fingerprint; treat them as not differing.
- **"Sync again" Syncs immediately, with no dialog.** From the "differs" banner it Syncs the Synced Week. From the failure banner it Syncs the failed record's calendar week. The existing `SyncDialog` button and week picker stay for everything else.
- **Failures surface in the app only.** If the latest Sync Record failed, the status line becomes a prominent destructive banner with the error and "Sync again". No email or push notifications; that is a separate future requirement if it's ever needed.
- **Setup recedes once configured.** When an API key is saved *and* Scheduled Sync is enabled, the Sync Time controls, API key and Sync History collapse behind a disclosure (e.g. "Sync settings & history"). The status line stays visible and always includes the last-Synced time ("Last Synced 2 hours ago · Next Sun 16 Nov 18:00"), so the runner knows how current the shown dates are. Before setup is complete, everything stays expanded as it is now.
- **No highlight on today** for now.
- No new ADR: this is a presentation change on top of ADR 0005 and is cheap to reverse.

## Steps

- [ ] Add a nullable fingerprint column to `syncRecords` in `src/db/schema.ts`, then run `pnpm db:generate`.
- [ ] Add a pure `fingerprint(workouts)` function (stable serialisation, then hash), unit-tested: same input gives the same hash; a change to any pushed field changes it.
- [ ] In `runSync`, store the fingerprint on succeeded records.
- [ ] Extend `getSyncState` to return what the UI needs:
  - successful Sync Records from the current week on, so the client can pick the Synced Week in local time (keep the one-week timezone slack used in `syncWeek`)
  - for each, whether the saved Planning State's fingerprint for that Monday differs from the stored one
  - the latest record (for the failure banner)
- [ ] Add a pure function, unit-tested, that picks the Synced Week (Monday, `ranAt`, whether it differs) from those records and "now". It returns none when no Synced week has ended yet. Cover the Sunday case (this week and next week both Synced) and a stale-only case.
- [ ] `WeekView`: when there is a Synced Week, show each day with its real date and a header "Week of <weekLabel> · Synced <relative time>". Add "Differs from your calendar · Sync again" when the fingerprints differ. Without a Synced Week, render exactly as now.
- [ ] Add a "Sync again" action that calls `syncWeek` for a given Monday without opening the dialog, then `router.invalidate()`. Disable it when `syncDisabled` is true, as the dialog is.
- [ ] Failure banner: when the latest record failed, show a destructive banner with its error and a "Sync again" for that record's Monday.
- [ ] `SyncSection`: when `hasApiKey && scheduledSync?.enabled`, collapse `ScheduledSyncSection`, `ApiKeySection` and `SyncHistory` behind a disclosure. Keep the status line (last Synced, next Sync) visible.
- [ ] Update e2e specs (`e2e/app.spec.ts`) for the dated view, the differs banner after a Plan Settings change, and the collapsed setup. Confirm `e2e/guest.spec.ts` still passes unchanged.
- [ ] `pnpm typecheck && pnpm lint && pnpm test && pnpm test:e2e`, then open a PR with before/after screenshots.

## Verification

- `pnpm test` and `pnpm test:e2e` pass.
- Manually, signed in with an API key and Scheduled Sync enabled:
  - after a Sync of next week, the main view shows next week's dates and "Synced …"
  - the setup and history are collapsed behind the disclosure, with the last-Synced time still visible
  - changing the Weekly Duration and saving shows "Differs from your calendar"; "Sync again" clears it and adds a Sync Record
  - a failed Sync (e.g. an invalid API key) shows the red banner with "Sync again"
- As a Guest, the view is undated and unchanged.
