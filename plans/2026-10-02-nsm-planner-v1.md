---
created: 2026-10-02
---

# NSM Planner v1: weekly Norwegian Singles planner (no Sync)

## Goal

A website that plans a Norwegian Singles Method (NSM) running week from a weekly time budget and per-day preferences, based on the threshold.works Plan Generator. v1 lets a signed-in user save their Plan Settings and see the derived Week for the current and next calendar week. Syncing to intervals.icu is the long-term purpose but is explicitly deferred to a later planning session.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. Not yet a git repository and contains no code. Existing files:
  - `CONTEXT.md` - the domain glossary (Plan Settings, Weekly Duration, Day Preference, Shuffle, Week, Sub-threshold Session, Rep Format, Rep Length, Long Run, Easy Run, Rest Day, Sync, Managed Workout). Use these terms in code, UI and docs; respect the `_Avoid_` lists.
  - `docs/adr/0001-weeks-derived-not-stored.md` - Weeks are computed on demand from Plan Settings plus the Week's Monday date and never stored.
  - `docs/research/threshold-works-model.md` - reverse-engineered, implementation-ready spec of the threshold.works planner (constants, rep tables, selection, placement, merge rule, rounding, display, worked examples, verbatim minified source). This is the reference algorithm; the deviations below override it.
- Single user today (the owner), but auth is built for many users with open signup.
- Hosting: the owner's local machine running Coolify, reachable on a public URL. Postgres is provisioned through Coolify.
- The owner's global instructions apply (YAGNI absolutely, sparse comments, plain "-" not em dashes, commit messages title-only, ask before pushing or commenting on GitHub).

## Decisions

### Stack

- TypeScript end to end, Node 24 LTS, pnpm.
- TanStack Start (React), currently the stable 1.x line (`@tanstack/react-start`, a Vite plugin; Vinxi is gone). Production Node server via Nitro v3 as a Vite plugin: `plugins: [tanstackStart(), nitro(), viteReact()]` with `import { nitro } from 'nitro/vite'`; `vite build` outputs `.output/server/index.mjs`, run with `node .output/server/index.mjs` on port 3000. Docs: https://tanstack.com/start/latest/docs/framework/react/guide/hosting. Nitro is only the deploy adapter, not an extra framework in app code.
- Data access through TanStack Start server functions (`createServerFn` with a validator); DB code in `*.server.ts` files, server-function wrappers in `*.functions.ts`, shared code in plain `*.ts`. No separate JSON API.
- UI: Tailwind CSS v4 + shadcn/ui.
- Postgres (Coolify) + Drizzle ORM + drizzle-kit migrations (plain SQL files committed). Rejected: SQLite (owner prefers Coolify Postgres), Kysely, raw SQL.
- Auth: Better Auth with email/password only, open signup. Sign up and sign in only: no email verification and no password reset, so no SMTP (a forgotten password is reset in the database). No GitHub or other social providers for now, no intervals.icu OAuth. Better Auth TanStack Start integration: catch-all server route `src/routes/api/auth/$.ts` forwarding GET/POST to `auth.handler(request)`, `tanstackStartCookies()` as the last plugin, route protection via `beforeLoad` + a server function reading the session. Docs: https://www.better-auth.com/docs/integrations/tanstack. Generate Better Auth's Drizzle schema with `npx auth@latest generate --adapter drizzle --dialect postgresql` (older name `@better-auth/cli`), then drizzle-kit generate/migrate.
- Tooling: Vitest (heavy on the Week generator), oxlint, oxfmt.
- Deploy: multi-stage Dockerfile (not Nixpacks). Container start command runs migrations then the server: `node migrate.js && node .output/server/index.mjs`, so a failed migration never serves traffic. In dev run migrations by hand (`pnpm db:migrate`).
- Secrets as Coolify environment variables: `DATABASE_URL`, `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`.

### Domain model and planner

- Plan Settings are the only persisted planning state, one row per user: Weekly Duration (integer minutes 240-600, entered as hours + minutes), warm-up and cool-down minutes (integers 5-20, default 10 each), a Day Preference per weekday (`default | rest | easy | long | subT`, store only non-default keys), and a Shuffle (random integer).
- A Week is a pure function `deriveWeek(planSettings, mondayDate)`; never stored (ADR 0001). Weeks run Monday to Sunday, fixed. Changing settings re-derives every Week, including past days; accepted.
- Follow `docs/research/threshold-works-model.md` duration mode exactly, except:
  - Randomness: replace every `Math.random` (including the biased `sort(() => Math.random() - .5)` shuffles) with a seeded PRNG keyed on the Shuffle combined with the Week's Monday date (ISO `YYYY-MM-DD`), so each calendar Week differs but is reproducible. Any simple PRNG and hash will do (e.g. mulberry32 over a string hash); exactness versus threshold.works is not a goal. Keep the 30-attempt loop and 1.5-point tolerance as is.
  - Sub-threshold share is a fixed constant 23% with no UI.
  - The Long Run is placed only on a Long-preferred or Default day (never on an Easy-preferred day). Keep the existing order: Long preference, else Sunday, else Saturday, else a random eligible day.
  - Easy-day merge rule merges Default easy days before Easy-preferred days.
  - Day Preference validation treats Sunday and Monday as adjacent (the week wraps).
  - Validation error, not silent behaviour, when there are more SubT preferences than the session count at that Weekly Duration (2 sessions at 240-258 min, 3 above), when there are not enough Default days to place all Sub-threshold Sessions on non-adjacent days, and when no Default or Long-preferred day is left for the Long Run. Replace the misleading "1.5% error rate" exhaustion message with a clear one about placement.
  - Enforce warm-up and cool-down within 5-20.
  - Kept from threshold.works: merged Rest Days may exceed the max of 2 (the max limits preferences only); missing Sub-threshold days are filled from Default days. Drop the "2-3 SubT days" hint text.
  - Dropped entirely: distance mode, pace/power benchmark, target pace display, imperial units, CSV export, post-generation interval swapping and duration editing, custom (Bakken / 90s) sessions.
- Intensity is shown as Rep Length pace labels only: 15K, HM, 30K. No concrete paces.
- Shuffle lifecycle: before first save the preview uses a random Shuffle generated in the browser; Save persists it. A Reshuffle button sets a new random Shuffle and saves only the Shuffle immediately (unsaved form edits stay unsaved); before the first save there is nothing to save, so Reshuffle only changes the preview's Shuffle. Shuffle changes affect every Week.

### UI

- Sign-in page (email/password sign in or sign up) and one main page.
- Plan Settings form: hours + minutes, warm-up, cool-down, seven Day Preference selects. New users start with empty Weekly Duration, 10/10, all Default. Live Week preview as the form changes once inputs are valid; explicit Save persists; validation messages shown inline.
- Week view: current Week and next Week only (toggle or tabs), "current" from the browser's local date. Each day card: weekday, type label (Sub-threshold, Easy, Long, Rest). Sub-threshold card: warm-up minutes, `${reps}×${minutes}min @${15K|HM|30K} (${work}min total)`, "1min rest in between", cool-down minutes, and the session's total minutes (work + reps - 1 + warm-up + cool-down; threshold.works omits this, we add it). Easy and Long cards: minutes. Rest card: "Rest day".
- Summary: total weekly minutes (sum of non-rest days, may differ slightly from input due to rounding), sub-threshold work minutes, sub-threshold % = work / total to one decimal.

### Ruled out for v1

- Sync to intervals.icu, scheduled jobs, failure notifications (deferred, see Open questions).
- Storing Weeks, multi-week progression, per-Week edits (ADR 0001).
- Signup allowlist, email verification, password reset, GitHub or other social sign-in, intervals.icu login.
- Cross-training or non-running sports.

## Steps

- [x] `git init`; scaffold a TanStack Start React app in the project root with pnpm (follow the current TanStack Start getting-started docs); add Nitro v3 as a Vite plugin; confirm `pnpm build` produces `.output/server/index.mjs` and `node .output/server/index.mjs` serves the app.
- [x] Add oxlint, oxfmt, Vitest; scripts `lint`, `format`, `test`, `build`, `start`, `db:generate`, `db:migrate`.
- [x] Add Tailwind CSS v4 and initialise shadcn/ui.
- [x] Implement the Week generator test-first (use the `/tdd` skill) as a pure module, e.g. `src/planner/`: seeded PRNG keyed on Shuffle + Monday date, rep tables, Sub-threshold Session selection, Day Preference validation, day placement, Long Run, Easy Runs, merge rule, totals, all with the deviations listed in Decisions. Tests assert rules across many Shuffles and dates rather than exact threshold.works outputs: session count by Weekly Duration, per-session work caps (25 min up to 300 min, 35 up to 420, none above), no adjacent Sub-threshold days including Sunday-Monday, Long Run 25% clamped 75-135 and never on an Easy-preferred day, merge behaviour and order, each validation error, determinism for the same Shuffle and date, variation across dates. Use the worked examples in the research doc as structural sanity checks.
- [x] Postgres + Drizzle: connection from `DATABASE_URL`; `plan_settings` table (user id primary key referencing the Better Auth user, weekly duration minutes, warm-up, cool-down, day preferences jsonb, shuffle integer, updated at); `migrate.js` using drizzle-orm's migrator; local Postgres for dev (e.g. a docker run command documented in the README).
- [x] Better Auth with email/password and the Drizzle adapter; generate its schema and migrate; auth route, session server function, protected main route; sign-in and sign-out UI.
- [x] Server functions: load the current user's Plan Settings (or none), save Plan Settings (validated with the same validation as the planner), reshuffle.
- [x] Main page: Plan Settings form with live preview, Save, Reshuffle, current/next Week view, summary, as described in Decisions/UI. Planner runs in the browser for preview from the same module.
- [x] Multi-stage Dockerfile (Node 24, pnpm, build, copy `.output` and migrations, `CMD` runs `node migrate.js && node .output/server/index.mjs`, port 3000); short README covering env vars, local dev, and Coolify deployment (Dockerfile build pack, Postgres resource, env vars, domain).
- [ ] Deploy to Coolify and sign in on the public URL.

## Verification

- `pnpm lint`, `pnpm test`, `pnpm build` all pass.
- Locally with Postgres running: `pnpm db:migrate`, `pnpm dev`, sign up with email and password, enter 6h 0m with all Default: the current Week shows 3 Sub-threshold Sessions on Tue/Thu/Sat, a 90 min Long Run on Sunday, equal Easy Runs on Mon/Wed/Fri, sub-threshold % near 23. Next Week has the same structure and usually different Rep Formats (only the 30K session is random; the other two follow from it, so about one Week in five repeats the set on different days). Reload: same Weeks. Reshuffle: Weeks change and persist across reload.
- 4h 0m all Default: 2 Sub-threshold Sessions on Tue/Thu, 75 min Long Run Sunday, two Easy Runs and two merged Rest Days.
- Sunday Easy preference at 10h: Long Run lands on a Default day (Mon, Wed or Fri, since Sub-threshold Sessions take Tue/Thu/Sat), never Sunday. SubT on Sunday and Monday: inline adjacency error. Three SubT preferences at 4h: error naming 2 sessions. Warm-up 25: error.
- Unsaved edits update the preview but are lost on reload; Save persists them.
- `docker build` succeeds and the container starts against a fresh database (migrations run first); deployed Coolify URL works with email sign-in.

## Open questions

- Sync to intervals.icu is deferred to its own planning session. Facts already gathered for it (2026-10-02): intervals.icu API allows browser CORS; personal API key auth is HTTP Basic with username `API_KEY`; OAuth exists but needs app approval, has no refresh tokens and needs a server for token exchange; `POST /api/v1/athlete/{id}/events/bulk?upsert=true` accepts the native text workout syntax in `description` (e.g. `- 4m 90-94% Pace`, `5x` repeats) and upserts by `external_id`, documented only for events created by the same OAuth app (alternative: `upsertOnUid`); rate limits 5000/day per API key. Earlier leanings (not final): per-user API keys encrypted at rest, a Sync Settings concept separate from Plan Settings holding timezone and connection, Nitro `scheduledTasks` hourly tick syncing Weeks at Sunday 18:00 local, overwrite only Managed Workouts, show last Sync status in the UI.
