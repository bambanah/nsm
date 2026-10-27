---
created: 2026-10-27
---

# Guest mode

## Goal

In the user's words: "I want to be able to use the app without signing in, with limited features (e.g. no intervals.icu sync). I presume we'll have to store some data in localStorage. Ideally, we would only store data in the db for signed in users."

So: `/` opens straight into the planner for a **Guest**. A Guest plans exactly like a signed-in runner but cannot Sync, and their Plan Settings and Session Choices live in localStorage only. Signing up or in carries a Guest's plan into the account when the account has none.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. TanStack Start (React, `@tanstack/react-start`), Tailwind v4, shadcn/ui, better-auth (email + password), Drizzle on Postgres, zod, sonner toasts, Vitest, Playwright.
- Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm dev` (port 3000), `pnpm test:e2e` (needs the e2e Postgres on `localhost:5434`, see `playwright.config.ts`). No schema change is needed, so no `pnpm db:generate`.
- Read first: `GLOSSARY.md` (defines **Guest**, Plan Settings, Session Choice, Week, Sync; use those terms in code and UI and never the `_Avoid_` words), `docs/adr/0003-session-choices-on-derived-weeks.md`, `docs/adr/0004-guests-plan-on-device.md` (the storage decision this plan implements). Both the glossary entry and ADR 0004 were written in the planning session; they are done.
- The Week is undated: `deriveWeek(settings, sessionChoices)` in `src/planner/planner.ts` takes no Monday, and Session Choices are keyed by weekday only (`session_choices` primary key `(user_id, weekday)` in `src/db/schema.ts`). A Guest's whole state is therefore one `PlanSettings` object plus up to 7 `SessionChoice`s.
- Auth:
  - `src/auth/auth.server.ts`: `getSession()`, `requireUserId()` (throws "Not signed in").
  - `src/auth/auth.functions.ts`: server fn `getUser()` returns the user or `null`.
  - `src/auth/auth-client.ts`: `authClient` (better-auth React client).
- Planner page `src/routes/index.tsx`:
  - Route has `ssr: 'data-only'` (loader runs on the server on first load, the component renders only on the client, so the component can read localStorage in a `useState` initialiser). `beforeLoad` currently redirects to `/sign-in` when `getUser()` is null.
  - The loader calls `getPlanSettings()`, `getSessionChoices()` and `getIntervalsConnection()`, all of which call `requireUserId()`.
  - `Home` keeps a `FormState`, derives `settings` with `toSettings`, validates with `validatePlanSettings` (`src/planner/validate.ts`), and autosaves 600 ms after a valid change via `savePlanSettings` then `router.invalidate()`. `chooseSession` calls `setSessionChoice` / `deleteSessionChoice`. Defaults for a new plan: empty duration, warm-up and cool-down `10`, no day preferences, `randomShuffle()`, no 5K Time.
  - `signOut` calls `authClient.signOut()` and navigates to `/sign-in`.
  - Passes `hasApiKey` and `syncDisabled` to `WeekView` (`src/components/week-view.tsx`), which renders `<SyncDialog week hasApiKey disabled />` (`src/components/sync-dialog.tsx`; the trigger is a `<Button variant="secondary" disabled={disabled}>` at around line 88).
- Server fns and their validation:
  - `src/plan-settings/plan-settings.functions.ts`: `planSettingsSchema` (zod), `getPlanSettings`, `savePlanSettings` (validates, then in one transaction `upsertPlanSettings` + `deleteDeadSessionChoices`).
  - `src/session-choices/session-choices.functions.ts`: `sessionChoiceSchema`, `setSessionChoice` (rejects unknown Rep Formats via `REP_FORMATS`, requires saved Plan Settings, rejects via `deadSessionChoices`), `deleteSessionChoice`.
  - `src/session-choices/session-choices.server.ts`: `findSessionChoices`, `upsertSessionChoice`, `deleteSessionChoices`, `deleteDeadSessionChoices`.
  - `src/plan-settings/plan-settings.server.ts`: `findPlanSettings`, `upsertPlanSettings` (both take an optional `executor` for transactions; `upsertSessionChoice` currently does not).
- Header `src/components/app-header.tsx`: `AppHeader({ user?, onSignOut? })` shows the name and a sign-out icon button when given. `src/routes/how-it-works.tsx` renders `<AppHeader />` with no props and has no auth.
- Sign-in page `src/routes/sign-in.tsx`: one form toggling sign-in/sign-up; on success navigates to `/`. `beforeLoad` redirects signed-in users to `/`.
- `src/components/explained.tsx`: `Explained` is a hover-on-mouse / tap-on-touch popover (Radix `Popover`) whose trigger is its own `<button>` and whose content ends in a "More →" link to `/how-it-works#section`. Its hover/tap logic is what the disabled Sync button needs.
- e2e: `e2e/auth.setup.ts` signs up `runner@example.com` and saves storage state to `playwright/.auth/user.json`; the `chromium` project uses it for every test in `e2e/app.spec.ts`. Guest tests need a context without that storage state (`test.use({ storageState: { cookies: [], origins: [] } })`).
- localStorage is already used for the theme in `src/routes/__root.tsx`, wrapped in try/catch; do the same.
- Repo rules (`/Users/lachlanunderhill/.claude/CLAUDE.md`, `CLAUDE.md`): YAGNI, minimal comments, plain "-" not em dashes, commit titles only (conventional commits enforced by commitlint), ask before pushing or commenting on GitHub. PRs that change the UI attach before/after screenshots saved outside the repo.

## Decisions

All settled with the user; do not reopen.

1. **Guests get everything except intervals.icu**: Plan Settings, Reshuffle, 5K Time, paces, Weekly Distance, Session Choices. No Sync, no intervals.icu Connection (and no Scheduled Sync if it is built later). Everything else is pure client-side derivation.
2. **`/` is open**: no redirect to `/sign-in`. The planner header shows a "Sign in" button for Guests where the sign-out button sits for runners. `/sign-in` stays its own page and gains a "Continue without signing in" link back to `/`. `/how-it-works` keeps its header as is (no auth controls), so the Sign in button must be opt-in via a prop, not shown whenever `user` is absent.
3. **Guest storage is localStorage only**, same shape as the server stores (`PlanSettings` + `SessionChoice[]`), same 600 ms autosave, same validation (including dropping dead Session Choices when settings change, and rejecting unknown / dead Rep Formats). The database never sees Guest data. Rejected: URL state (long URLs, history entry per edit), better-auth anonymous accounts (db rows for every passer-by), nothing persisted. Recorded in ADR 0004.
4. **Warning toast**: the first change in each browser session that saves to localStorage (any Plan Settings edit, Reshuffle, or Session Choice) shows a sonner toast, "Saved on this device only. Sign in to plan from other devices.", with a "Sign in" action to `/sign-in`. Loading the page with an existing local plan does not count. "Once per browser session" = a sessionStorage flag (try/catch). Rejected: a permanent sidebar line, a toast on every change.
5. **Sync for Guests is disabled with an explanation**: the Sync button stays visible but disabled, inside a hover/tap popover reading "Sign in to Sync to intervals.icu" with "Sign in" as a link. Reuse `Explained`'s hover/tap behaviour (a native `title` does not show on touch, and disabled buttons get no pointer events); generalise or extract from `Explained` rather than duplicate. A `<button>` cannot nest inside `Explained`'s trigger `<button>`, so the trigger must wrap the disabled button in a non-button element and the disabled button needs `pointer-events: none` so the wrapper receives the events. Rejected: hiding the button, an enabled button opening a sign-in prompt.
6. **Carrying a plan into an account**: after a successful sign-up or sign-in, if the Guest has a local plan, the client sends it to one new server fn that, in a transaction, saves it as the account's Plan Settings and Session Choices **only if the account has no Plan Settings**; otherwise it does nothing (the account wins, no prompt). The server validates it exactly as `savePlanSettings` / `setSessionChoice` do, dropping dead or unknown Session Choices rather than failing the whole adoption. Rejected: asking which plan to keep, local always wins.
7. **localStorage is cleared** once the adoption call succeeds (whether or not it adopted anything), so the db is the only copy. Signing out navigates to `/`, which shows a fresh Guest planner with defaults and a new Shuffle, not the account's plan.
8. **Bad local data**: unparseable or schema-invalid JSON is treated as no plan (defaults). A plan that parses but fails `validatePlanSettings` (e.g. after a rule change) loads into the form and shows the usual errors, as stored settings do for runners.
9. **Signed-in runners are unchanged**, and every existing server fn still requires sign-in.

## Steps

- [ ] Move `planSettingsSchema` and `sessionChoiceSchema` out of the `.functions.ts` files into a module both the client and server import (e.g. next to the planner types), so the Guest store and the adoption server fn parse with the same schemas. Keep the server fns using them.
- [ ] Add a Guest plan store module (e.g. `src/guest/guest-plan.ts`) with `load` (returns `{ settings, sessionChoices }` or `null`, zod-parsed, try/catch), `save` and `clear` for a single localStorage key. Unit-test parse failure → `null` and the round trip.
- [ ] Factor the client-side Session Choice checks (known Rep Format via `REP_FORMATS`, `deadSessionChoices`) so the Guest path and the server path use the same function; on a Guest settings save, drop dead Session Choices as `deleteDeadSessionChoices` does.
- [ ] `src/routes/index.tsx`: remove the `/sign-in` redirect. Loader returns `user` and, only when signed in, the server data; for a Guest return `settings: null, sessionChoices: [], hasApiKey: false` and skip the server fns. In `Home`, a Guest's saved state comes from the Guest store (in the `useState` initialiser) and autosave / `chooseSession` write to it instead of calling server fns. Keep one code path for the form and derivation; branch only at load and save.
- [ ] Guest warning toast on the first saving change per browser session (Decision 4).
- [ ] Header: add an opt-in "Sign in" button (link to `/sign-in`) for Guests on the planner; leave `/how-it-works` unchanged. Sign out navigates to `/` and the planner must reset to fresh Guest defaults (e.g. key `Home` by user id, or otherwise ensure state does not carry over).
- [ ] Sync: pass whether the viewer is a Guest down to `SyncDialog` (or `WeekView`) and render the disabled button inside the hover/tap popover from Decision 5, extracting the shared popover behaviour from `Explained`.
- [ ] Add a server fn (e.g. `adoptGuestPlan` in `src/plan-settings/plan-settings.functions.ts`) implementing Decision 6 in a single transaction; give `upsertSessionChoice` an `executor` parameter for it.
- [ ] `src/routes/sign-in.tsx`: after a successful sign-in or sign-up, if the Guest store has a plan, call the adoption fn, then clear the store (Decision 7), then navigate to `/`. Add the "Continue without signing in" link to `/`.
- [ ] e2e (`e2e/app.spec.ts` or a new spec) with an empty storage state: a Guest can open `/`, enter Plan Settings, see a Week, reload and still see it, sees the toast once, and finds Sync disabled. A Guest who signs up sees their plan as the account's plan and localStorage is empty. Signed-in runner tests continue to pass.
- [ ] Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e`.

## Verification

- All of `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm test:e2e` pass.
- Manually with `pnpm dev` in a private window:
  - `/` opens the planner without signing in; header shows "Sign in"; `/how-it-works` header unchanged.
  - Entering Plan Settings shows a Week; the first change shows the toast once; further changes and Reshuffles do not; a reload keeps the plan and Session Choices.
  - Sync is disabled; hovering (desktop) and tapping (phone-width emulation with touch) shows "Sign in to Sync to intervals.icu" with a working Sign in link.
  - No `plan_settings` or `session_choices` rows are written while a Guest.
  - Sign up from that state: the account shows the same plan, the rows now exist, localStorage key is gone.
  - Sign out: fresh Guest planner with defaults. Make a new local plan, sign in to the existing account: the account's plan shows, the local plan is discarded.
  - Corrupt the localStorage value by hand: the planner loads with defaults, no crash.
