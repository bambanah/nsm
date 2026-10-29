---
created: 2026-10-29
---

# Planning State module

## Goal

Move every rule about what saving Plan Settings or choosing a session does to the stored pair `{settings, sessionChoices}` into one pure **Planning State** module, so a Planning State can never hold a dead Session Choice. This fixes a real Guest bug and a signed-in race, and replaces four slightly different copies of the rule with one module that is tested through its interface.

This came out of an architecture review (candidate 1 of 5, the top recommendation). Candidates 2 (a Planning State store seam with Guest and signed-in adapters) and 3 (a deeper, testable Sync module) build on this one and are out of scope here.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. Stack: TanStack Start (`createServerFn`), React, Drizzle on Postgres, zod, Vitest, Playwright.
- Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm test:e2e` (needs the e2e Postgres on `localhost:5434`, see `playwright.config.ts`). No schema change, so no `pnpm db:generate`.
- Read first:
  - `GLOSSARY.md`: **Planning State** was added in the planning session. Use glossary terms in code and never the `_Avoid_` words; in particular "Plan" names nothing, which is why the pair is a Planning State.
  - `docs/adr/0004-guests-plan-on-device.md`: Guests keep their state in localStorage.
  - `docs/adr/0005-one-undated-week.md`: one undated Week, with Session Choices keyed by weekday.
- A **dead** Session Choice is one whose weekday is not a Sub-threshold Session in the Week derived from the settings, or whose Rep Format exceeds the per-session cap. Today `deadSessionChoices(settings, choices)` and `sessionChoiceError(settings, choice)` in `src/planner/planner.ts:99-119` compute this. `sessionChoiceError` also returns `'Unknown Rep Format'` for a format not in `REP_FORMATS`, and `'That Rep Format does not fit this day'` for a dead choice.
- The four places that enforce the rule today, each differently:
  - `src/routes/index.tsx:176-195`: the Guest's debounced (600 ms) settings save prunes with `deadSessionChoices`.
  - `src/routes/index.tsx:198-219`, `chooseGuestSession` and `chooseSession`:
    - The Guest path checks the new choice against the **form** settings, but saves `others` without pruning them. **This is the bug:** pick a session within 600 ms of changing Day Preferences and dead choices are written to localStorage. The debounce effect then sees `samePlanSettings` and never prunes them, and `planDays` re-applies a dead choice if its weekday becomes a Sub-threshold day again.
    - The signed-in path calls `setSessionChoice` or `deleteSessionChoice`, and the server checks the choice against the **saved** settings. Inside the same window a runner gets a spurious "does not fit this day" for a session that fits the Week they can see.
  - `src/plan-settings/plan-settings.functions.ts:17-27`, `savePlanSettings`: validates, then upserts the settings and calls `deleteDeadSessionChoices` in a transaction.
  - `src/plan-settings/plan-settings.functions.ts:29-41`, `adoptGuestPlan`: returns silently on invalid settings, and silently drops choices that `sessionChoiceError` rejects.
- Other files in play:
  - `src/session-choices/session-choices.functions.ts`: `getSessionChoices`, `setSessionChoice`, `deleteSessionChoice`.
  - `src/session-choices/session-choices.server.ts`: `findSessionChoices`, `upsertSessionChoice`, `deleteSessionChoices`, `deleteDeadSessionChoices`. Every function takes an optional `executor` for transactions.
  - `src/plan-settings/plan-settings.server.ts`: `findPlanSettings`, `upsertPlanSettings`.
  - `src/guest/guest-plan.ts`: `GuestPlan`, `loadGuestPlan`, `saveGuestPlan`, `clearGuestPlan`. localStorage key `'guestPlan'`, every function wrapped in try/catch. Tests are in `src/guest/guest-plan.test.ts`.
  - `src/planner/schemas.ts:29`: `guestPlanSchema`.
  - `src/routes/sign-in.tsx:34-42`: loads the Guest's state and calls `adoptGuestPlan`.
  - `src/planner/planner.test.ts:255-302`: tests for `deadSessionChoices` and `sessionChoiceError`.
  - `src/planner/validate.ts`: `validatePlanSettings(settings)` returns field errors. The route uses it to show `FieldErrors`, and the Week (with its session picker) only renders while there are no errors (`index.tsx:349`).
- The user's standards (from `~/.claude/CLAUDE.md`):
  - YAGNI.
  - Comments only when they earn their place.
  - Plain "-" rather than em dashes.
  - Commit titles only, without a body unless it earns one.
  - Ask before pushing or commenting on GitHub.
  - The user prefers **fewer, more valuable tests that cover critical flows** over many tests.

## Decisions

- **Name: Planning State.**
  - The glossary already said Plan Settings plus Session Choices are "the only planning state the app stores".
  - "Plan" is a glossary `_Avoid_` word for Week.
  - Rejected: "Plan Inputs", and leaving the pair unnamed.
- **Module location:** `src/planner/planning-state.ts`, pure, next to `deriveWeek`.
- **Interface: exactly two functions.**
  - `planningState(settings, sessionChoices): PlanningState`:
    - Throws an `Error` if `validatePlanSettings(settings)` returns any errors, with their messages joined by `', '` as `savePlanSettings` does today.
    - Otherwise returns `{settings, sessionChoices}` with dead choices and unknown Rep Formats dropped.
    - Saving new settings is `planningState(newSettings, state.sessionChoices)`. Loading and adoption use the same call. There is no separate `withSettings` or `normalize`.
  - `withSessionChoice(state, weekday, repFormat?): PlanningState`:
    - Without a `repFormat`, it removes that weekday's choice.
    - With one, it replaces that weekday's choice. It throws `Error('Unknown Rep Format')` or `Error('That Rep Format does not fit this day')` if the choice is not valid against `state.settings`.
  - No `week(state)` helper, because no caller needs one.
- **Errors are thrown, not returned.** The server functions already throw, and the route's `chooseSession` already catches into `actionError`.
- **The module owns settings validity**, so a Planning State is always valid. The route still calls `validatePlanSettings` for field errors.
- **`deadSessionChoices` and `sessionChoiceError` become internal** to the module: move them in, or stop exporting them, and remove every outside import.
- **A Session Choice is checked against the form settings,** i.e. the Week the runner is looking at, for both Guests and signed-in runners. The settings and the choice are saved together. This follows ADR 0005's rule that what the runner sees is what is acted on. Rejected:
  - disabling picking while settings are unsaved;
  - flushing the pending settings save first.
- **Signed-in server functions:**
  - `savePlanSettings(settings)`: in one transaction, load the stored choices, run `planningState(settings, stored)`, upsert the settings and replace the choices.
  - New `chooseSession({settings, weekday, repFormat?})`: in one transaction, `withSessionChoice(planningState(settings, stored), weekday, repFormat)`, then upsert the settings and replace the choices. It replaces both `setSessionChoice` and `deleteSessionChoice`.
  - `deleteDeadSessionChoices` is deleted.
  - `session-choices.server.ts` keeps `findSessionChoices` plus a "replace this runner's choices" write (delete all, then insert). `upsertSessionChoice` and `deleteSessionChoices` go if nothing else uses them.
  - Merging the plan-settings and session-choices server modules into one Planning State repository is deferred to candidate 2.
- **Healing stored Guest data:** `loadGuestPlanningState` runs the parsed data through `planningState`. If it throws, the existing `catch` returns `null`, which is the same as having no saved state. Signed-in loads are not healed: every database write goes through the module, and the server always checked choices against the saved settings, so the database cannot hold dead choices.
- **Adoption stays silent:** `adoptGuestPlanningState` calls `planningState` inside a try. On a throw it skips, as it does today. Otherwise it writes the result if the account has no Plan Settings yet. Rejected: telling the runner what was dropped, which nobody asked for.
- **Renames:**
  - `GuestPlan` → `PlanningState`.
  - `guestPlanSchema` → `planningStateSchema`.
  - `loadGuestPlan` / `saveGuestPlan` / `clearGuestPlan` → `loadGuestPlanningState` / `saveGuestPlanningState` / `clearGuestPlanningState`.
  - `adoptGuestPlan` → `adoptGuestPlanningState`.
  - **The localStorage key stays `'guestPlan'`.** Changing it would lose every existing Guest's saved state.
- **`deriveWeek`'s own cap check in `planDays` (`planner.ts:141`) stays.** `SessionPicker` (`week-view.tsx:436`) calls `deriveWeek` with candidate choices to preview each Rep Format, so the check is part of `deriveWeek`'s interface.
- **Tests: two, through the interface,** in `src/planner/planning-state.test.ts`:
  1. **Race flow:** build a Planning State, choose a session on a Sub-threshold day, change Day Preferences so that day is no longer a Sub-threshold Session (`planningState(newSettings, state.sessionChoices)`), then change them back. The choice is gone.
  2. **Error:** a choice that does not fit its day throws `'That Rep Format does not fit this day'`.

  Delete the `deadSessionChoices` and `sessionChoiceError` assertions and tests. Keep the `deriveWeek` assertions in `planner.test.ts:257-277`, which cover `deriveWeek` ignoring dead and over-cap choices. Adjust `guest-plan.test.ts` only for the renames. No new e2e test: the race cannot happen once the route checks choices against the form settings.
- No ADR: none of these choices is hard to reverse.

## Steps

- [ ] Add `src/planner/planning-state.ts`:
  - export `type PlanningState = { settings: PlanSettings; sessionChoices: SessionChoice[] }`, `planningState` and `withSessionChoice` as decided;
  - move `deadSessionChoices` and `sessionChoiceError` in from `planner.ts`, unexported, or keep them in `planner.ts` without exports if that avoids a cycle.
- [ ] Rename `guestPlanSchema` → `planningStateSchema` in `src/planner/schemas.ts`.
- [ ] Write the two tests in `src/planner/planning-state.test.ts`. Remove the `deadSessionChoices`/`sessionChoiceError` tests and imports from `planner.test.ts`, keeping its `deriveWeek` assertions.
- [ ] `src/guest/guest-plan.ts`:
  - rename the functions and use `PlanningState`;
  - in `loadGuestPlanningState`, return `planningState(parsed.settings, parsed.sessionChoices)` inside the existing try;
  - keep the key `'guestPlan'`;
  - update `guest-plan.test.ts` for the renames.
- [ ] Server:
  - in `session-choices.server.ts`, replace `upsertSessionChoice`/`deleteSessionChoices`/`deleteDeadSessionChoices` with a `replaceSessionChoices(userId, choices, executor)`;
  - rewrite `savePlanSettings` and `adoptGuestPlan` (→ `adoptGuestPlanningState`) in `plan-settings.functions.ts` on top of `planningState`;
  - in `session-choices.functions.ts`, replace `setSessionChoice`/`deleteSessionChoice` with `chooseSession({settings, weekday, repFormat?})`, which needs a zod validator that extends `weekdaySchema` with `settings: planSettingsSchema` and an optional `repFormat`.
- [ ] `src/routes/index.tsx`:
  - the Guest debounce save calls `saveGuest(planningState(next, sessionChoices))`;
  - `chooseSession`:
    - Guests: `saveGuest(withSessionChoice(planningState(settings, sessionChoices), weekday, repFormat))`;
    - signed-in runners: call the `chooseSession` server function with `{settings, weekday, repFormat}`, then `router.invalidate()`;
    - both paths share one try/catch that sets `actionError`;
  - delete `chooseGuestSession`, and drop the `deadSessionChoices`/`sessionChoiceError` imports;
  - rename `GuestPlan` usages.
- [ ] `src/routes/sign-in.tsx`: use the renamed load, clear and adopt functions.
- [ ] `grep -rn "deadSessionChoices\|sessionChoiceError\|GuestPlan\|guestPlanSchema\|setSessionChoice\|deleteSessionChoice" src e2e` should only find hits inside `src/planner/`.
- [ ] Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`.

## Verification

- `pnpm typecheck`, `pnpm lint` and `pnpm test` pass, including the two new Planning State tests.
- `pnpm test:e2e` passes; the Guest and signed-in specs exercise saving and session picking.
- Manual check of the race (`pnpm dev`, port 3000):
  1. As a Guest, change a Day Preference and pick a Rep Format on a Sub-threshold day within about half a second. Change the preference so that day stops being Sub-threshold, then back again. The planner's pick shows, not your old choice. `localStorage.guestPlan` never holds a choice for a non-Sub-threshold day.
  2. Signed in, do the same quick change-then-pick. No "does not fit this day" error appears.
