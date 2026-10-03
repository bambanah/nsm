---
created: 2026-10-03
---

# Session Choices

## Goal

In the user's words: "I want to be able to choose which sub-threshold session for a given day, and see all of the available options in a dropdown, including the ones that won't work for time reasons (if any)."

So: on any Sub-threshold day of a Week, the runner can replace the planner's Rep Format with one they pick from a dropdown. The pick is stored as a **Session Choice** and survives reloads (and a future Sync). Options that break the per-session work cap are listed but disabled with the reason.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. TanStack Start (React), Tailwind v4, shadcn/ui, Drizzle on Postgres, Vitest. Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm dev` (port 3000), `pnpm db:generate` (drizzle-kit generates a migration from `src/db/schema.ts` into `drizzle/`; never hand-edit `drizzle/`), `pnpm db:migrate` (needs `.env`).
- Domain glossary `CONTEXT.md` already defines **Session Choice** and has the amended **Week** and **Plan Settings** entries. Use those terms in code, UI and docs, and never the `_Avoid_` words ("override", "edit", "custom session").
- `docs/adr/0003-session-choices-on-derived-weeks.md` (supersedes 0001) records the core decision. Read it first.
- Planner: `src/planner/planner.ts`.
  - `deriveWeek(settings, monday)` seeds `createRandom` with `${shuffle}:${monday}`. It loops up to 30 attempts: `selectRepFormats` picks one 30K, one 15K and one HM format, then `planDays` places them on non-adjacent days and sizes the Long Run and Easy Runs from the remaining minutes (`subTTotal`). Finally `summarise` computes the totals and the Sub-threshold Share.
  - `toSession(repFormat, settings)` builds a `SubThresholdSession`; Recovery comes from `RECOVERY_MINUTES[repLength]`.
  - Per-session cap: when `weeklyDurationMinutes <= SESSION_CAP_UNTIL_MINUTES` (420), a format is allowed only if `workMinutes(f) <= SESSION_WORK_CAP_MINUTES` (35). Above 420 there is no cap. This check is currently inline in `selectRepFormats`.
- Rep Formats: `src/planner/rep-formats.ts` has `REP_FORMATS` (27 formats: 11 15K, 10 HM, 6 30K), `RepFormat { repLength, reps, repMinutes }` and `workMinutes`.
- Tests: `src/planner/planner.test.ts` (property-style checks over many settings), `src/planner/validate.test.ts`.
- Plan Settings persistence:
  - `src/db/schema.ts` defines the `plan_settings` table, keyed by `userId`.
  - `src/plan-settings/plan-settings.server.ts` has `findPlanSettings` and `upsertPlanSettings`.
  - `src/plan-settings/plan-settings.functions.ts` has the server fns `getPlanSettings` and `savePlanSettings` (zod schema + `validatePlanSettings`, `requireUserId`).
- UI:
  - `src/routes/index.tsx`: the loader returns `getPlanSettings()`. `Home` keeps the form state and autosaves 600 ms after a valid change (`savePlanSettings` then `router.invalidate()`). Reshuffle is just a form change to `shuffle`, so it goes through the same save.
  - `Weeks` renders "This week" and "Next week" tabs and calls `deriveWeek(settings, monday)` **client-side from the live form settings**, so the Week updates before the save lands.
  - `src/components/week-view.tsx`: `WeekView` shows the stat cards and day cells. Clicking a day opens `DayBreakdown`, whose title is `<weekday> · Sub-threshold Session <minutes> min`, followed by the steps list and `PaceNote`. The shadcn `Select` lives at `src/components/ui/select.tsx` (index.tsx already uses it for Day Preferences).
- Research: `docs/research/nsm-rationale.md` line 112 lists "the one long / medium / short template" under "Supported". That's inaccurate. The sources (guide example week Tue long / Thu medium / Sat short; sirpoc: every format reaches "the same state of sub threshold", variety is psychological) agree with the template but don't require it. The one-of-each rule comes from the threshold.works algorithm (`docs/research/threshold-works-model.md:85-88`). `src/routes/how-it-works.tsx:108` already labels the planner's pick as *planner choice*, so the page needs no change.
- User constraints (global): YAGNI; comments only where they earn their place; plain "-" never em dashes in new prose and code; commit messages are a concise title only.

## Decisions

- **Stored per Week, not client-only and not a Plan Setting.** A Session Choice is keyed by (user, Week Monday, weekday) and holds a Rep Format. Client-only picks would be lost on reload and invisible to Sync. A per-weekday Plan Setting would repeat the same session every Week. Storing whole Weeks was rejected in ADR 0003.
- **The dropdown offers all 27 Rep Formats**, grouped by Rep Length, not just the planner's Rep Length. The sources don't require one-of-each, so a Week may end up with e.g. two HM sessions.
- **The planner itself is unchanged**: it still picks one 30K, one 15K and one HM session. Whether to drop that rule is a separate question the user can raise later.
- **"Won't work for time reasons" means the per-session cap**: rep minutes over 35 while the Weekly Duration is 7h or less. Those options are shown disabled with the reason (e.g. "Over the 35 min per-session cap below 7h") and can't be selected. The Week can't otherwise stop fitting with these formats at 5-9h, so no other check is needed.
- **Every option shows the Sub-threshold Share** the Week would have with that pick, as information only, never a block.
- **Other sessions stay fixed after a pick.** Only the chosen day's session changes. Easy Runs and the Long Run are recalculated from the new `subTTotal`, and the share moves. Don't re-optimise the other sessions.
- **Planner picks must not shift when a choice exists.** Apply choices after the planner has chosen and placed its formats: the attempt loop's acceptance (distance to target) uses the planner's own formats, and `planDays` swaps in chosen formats for chosen weekdays before sizing Easy/Long Runs. This keeps the random stream, and so every other choice the planner makes, identical.
- **The first dropdown option is the planner's pick**, labelled e.g. `4×7′ @HM (planner)`. Selecting it deletes the Session Choice. So a subT `Day` must expose the planner's Rep Format as well as the applied one.
- **Dead Session Choices are deleted, not kept dormant.** On every `savePlanSettings` (which includes a Reshuffle), the server re-derives each Week that has Session Choices using the new settings, and deletes any choice whose weekday is no longer a Sub-threshold Session or whose format now exceeds the cap. Deletion is silent: no warning in the form. Changing a setting back does not bring the choice back.
- **Client-side derivation from unsaved form settings skips choices that don't apply** (wrong day type or over cap). This matches what the server sweep will produce once the autosave lands.
- **Reshuffle does not clear Session Choices** beyond what the sweep removes.
- **The dropdown lives in `DayBreakdown`**, in the title, replacing the plain Rep Format text there. It doesn't go on the day cards, where a click already selects the day.

## Steps

- [ ] Extract the cap check into an exported helper in `planner.ts`, e.g. `exceedsSessionCap(repFormat, weeklyDurationMinutes)`, and use it in `selectRepFormats`.
- [ ] Add a `SessionChoice` type (`{ weekday: Weekday; repFormat: RepFormat }`) and an optional `sessionChoices: SessionChoice[]` parameter to `deriveWeek`. Apply the choices per the Decisions above. Add the planner's own format to the subT day (e.g. `session.plannerRepFormat`, or a field on the `Day`) so the UI can label the planner option. Ignore choices for non-subT days or over-cap formats.
- [ ] Add an exported pure function that returns the Session Choices that no longer apply for given settings and a Week's choices (used by the sweep). Write tests in `planner.test.ts`:
  - with no choices the Week is unchanged;
  - a choice replaces only its day's session, and Recovery follows the chosen Rep Length;
  - the other sessions and the Sub-threshold days are unchanged;
  - total minutes still match the Weekly Duration as before;
  - choices on non-subT days and over-cap choices are ignored and reported as dead.
- [ ] Add a `session_choices` table in `src/db/schema.ts`: `userId` (FK to user, cascade), `monday` (text `YYYY-MM-DD`, matching how Mondays are passed today), `weekday`, `repLength`, `reps`, `repMinutes`, `updatedAt`, primary key (`userId`, `monday`, `weekday`). Run `pnpm db:generate`.
- [ ] Add `src/session-choices/session-choices.server.ts` (find by user, upsert, delete one, delete many) and `session-choices.functions.ts` with server fns, following the plan-settings pattern:
  - `getSessionChoices`: all of the user's choices, or only the Mondays shown.
  - `setSessionChoice({ monday, weekday, repFormat })`: zod-validate; reject if the format isn't in `REP_FORMATS`, there are no saved Plan Settings, the day isn't a Sub-threshold Session in `deriveWeek(saved settings, monday)`, or the format exceeds the cap.
  - `deleteSessionChoice({ monday, weekday })`.
- [ ] In `savePlanSettings`, after the upsert, load the user's Session Choices, group them by Monday, find the dead ones with the new settings, and delete them (in one transaction with the upsert if Drizzle allows it simply).
- [ ] In `src/routes/index.tsx`, load Session Choices alongside Plan Settings in the loader. Pass each Week's choices into `deriveWeek` in `Weeks`. Pass set and clear callbacks into `WeekView` that call the server fns and then `router.invalidate()`.
- [ ] In `week-view.tsx`, put a `Select` in the `DayBreakdown` title for subT days:
  - first item is the planner's format with "(planner)", which clears the choice;
  - then all `REP_FORMATS` grouped by Rep Length, each showing `reps×repMinutes′ @RepLength` and the Week's share with that pick (derive the Week with that hypothetical choice and read `subThresholdPercent`);
  - over-cap items are disabled with the reason.
  - `WeekView` will need the settings and the Week's choices, or a function that derives a hypothetical Week, to compute per-option shares.
- [ ] Fix `docs/research/nsm-rationale.md` line 112: move the one long / medium / short template out of "Supported" and say the sources agree with it but don't require it; one-of-each comes from threshold.works and is a planner choice.
- [ ] Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`.

## Verification

- `pnpm test`, `pnpm typecheck` and `pnpm lint` pass, including the new planner tests.
- `pnpm db:migrate`, then `pnpm dev`, sign in, and click a Sub-threshold day:
  - The dropdown lists the planner option first, then every Rep Format grouped by Rep Length, each with a share.
  - With the Weekly Duration at 7h or less, formats over 35 rep minutes (e.g. 3×12′ @30K) are disabled with the cap reason. Above 7h they're enabled.
  - Picking a format updates that day, its steps and Recovery, the Easy and Long Run minutes, and the share stat. The other Sub-threshold days are unchanged. A reload keeps the pick. Next week is unaffected.
  - Picking the "(planner)" option restores the planner's session.
  - Setting that weekday's Day Preference to Rest (or reshuffling until the day moves), then reverting, leaves the choice gone. Dropping the Weekly Duration to 6h with a 3×12 choice deletes it.
