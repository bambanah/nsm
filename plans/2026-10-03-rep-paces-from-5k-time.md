---
created: 2026-10-03
---

# Rep Paces from a 5K Time

## Goal

In the user's words: "I want to be able to input my 5k pace and get my training paces (e.g. HM, 15k etc.). This could be a section in the expandable settings section that has a summary of training paces underneath when collapsed. These paces should show up in the sub-t expanded details section."

So: an optional 5K Time in Plan Settings, from which the app derives a Rep Pace range for each Rep Length (15K, HM, 30K). These show in the collapsed settings summary and in the Sub-threshold Session breakdown, and How this works explains them.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. TanStack Start (React), Tailwind v4, shadcn/ui, Drizzle on Postgres, Vitest. Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm dev` (port 3000), `pnpm db:generate` (drizzle-kit generates a migration from `src/db/schema.ts` into `drizzle/`), `pnpm db:migrate` (applies migrations; needs `.env`).
- Domain glossary: `CONTEXT.md`. The grilling session already added **5K Time** and **Rep Pace**, and added the optional 5K Time to **Plan Settings**. Use these terms in code, UI and docs, and respect the `_Avoid_` lists: never "training pace", "target pace", "zone", "PB" or "race time".
- ADR `docs/adr/0002-nsm-sources-over-threshold-works.md`: the app follows the method's sources, and on How this works it labels unsourced numbers as "planner choice".
- Research: `docs/research/nsm-rationale.md`, section "Pacing" (around line 90), quotes the guide on pacing: use current fitness, start at the slower end, reassess every 4-8 weeks, heart rate and effort.
- Plan Settings flow:
  - `src/planner/planner.ts` defines the `PlanSettings` interface.
  - `src/planner/validate.ts` has `validatePlanSettings`, which returns `PlanSettingsError[]` keyed by `field`.
  - `src/db/schema.ts` defines the `plan_settings` table.
  - `src/plan-settings/plan-settings.server.ts` has `findPlanSettings`, which selects columns explicitly, and `upsertPlanSettings`.
  - `src/plan-settings/plan-settings.functions.ts` holds the server functions.
- Planner screen `src/routes/index.tsx`:
  - Form state: `FormState`, `toForm`, `toSettings` and `samePlanSettings`. The form auto-saves 600 ms after a valid change.
  - Layout: a collapsed summary line (`{hours}h {minutes}m · warm-up · cool-down · day prefs`), an Edit button that toggles `expanded`, and the expanded fields wrapped in `Field` (label plus that field's errors).
  - `NumberInput` is the existing input component.
- `src/components/week-view.tsx`:
  - `SessionDetails` is the compact day card. It stays unchanged.
  - `steps()` builds the breakdown rows; rep rows are labelled `Rep ${i} @${repLength}`.
  - `DayBreakdown` renders the rows plus the footer "Run the reps at your current {RACE_PACES[repLength]}."
  - `WeekView` receives only `week`.
- `src/planner/rep-formats.ts` has `RepLength = '15K' | 'HM' | '30K'` and `RACE_PACES` (display names like "half-marathon race pace").
- `src/routes/how-it-works.tsx` already has a `Pacing` section (`id="pacing"`). It says "The planner does not compute paces", which this plan makes untrue. Section ids are typed by `HowItWorksSection` in `src/components/explained.tsx`. `Explained` is the label-with-popover component that links to a section.
- Owner's global instructions: YAGNI absolutely; sparse comments; plain "-", never em dashes; commit messages are a title only; ask before pushing.

## Decisions

- **Input is a 5K race time in mm:ss**, not a pace, because runners remember a 5K as a finish time. Store it as integer seconds in a nullable column (e.g. `five_k_seconds`), and add `fiveKSeconds: number | null` to `PlanSettings`.
- **Optional.** With no 5K Time the app behaves as it does today: no paces in the summary, and the breakdown footer keeps its race-pace-name wording.
- **Validation is format-only.** An empty input means null. Otherwise the input must be `m:ss` or `mm:ss` with seconds under 60 and a total above zero. Add a `fiveKTime` field to `PlanSettingsError`. Rejected: plausibility bounds (e.g. 12:00-45:00). The user called them arbitrary; the formulas give an answer for any positive time, and silly input only gives silly paces to the person who typed it.
- **Units are per km only.** A miles toggle was not asked for.
- **Only 15K, HM and 30K Rep Paces.** No easy pace, which would need a separate model.
- **Equivalence model: Daniels-Gilbert VDOT.** This is what the Lactrace calculator (https://lactrace.com/norwegian-singles) uses, and the NSM guide links to Lactrace as a reference. Rejected: Riegel (optimistic at 30K) and Copeland's book table (paid, unread). With v in m/min and t in minutes:
  - VO2(v) = -4.60 + 0.182258·v + 0.000104·v²
  - %max(t) = 0.8 + 0.1894393·e^(-0.012778·t) + 0.2989558·e^(-0.1932605·t)
  - VDOT = VO2(d/t) / %max(t)
  - For each distance d (15000, 21097.5 and 30000 m), solve VDOT(d, T) = VDOT(5000, 5K Time) for T numerically (bisection). The equivalent race pace is T / (d / 1000) seconds per km.
- **Rep Pace is a range, the Lactrace method**: from the equivalent race pace `a` (s/km) to `a × 1.03` when `a < 300`, else `a + 10`. The user chose this over the guide's race-distance bands (short 12K-15K, medium 20K-HM, long 25K-30K). Those are fully sourced, but at HM they collapse to about 1 s/km. Lactrace's fast end is exactly the race pace each Rep Length is named after, and sirpoc's "HM pace + 2 seconds per KM" falls inside it. The 3% / 10 s width has no source, so How this works labels it a *planner choice*. No ADR: it is easy to reverse.
- **Display:** whole seconds, `m:ss-m:ss/km` (plain hyphen). Round each end independently.
- **Where paces appear:**
  - **Collapsed summary:** the 5K Time and all three Rep Paces, e.g. `5K 20:00 · 15K 4:15-4:23 · HM 4:21-4:29 · 30K 4:27-4:35 /km`. Placement within the summary is the implementer's call.
  - **5K Time input:** goes in the expanded section like the other fields.
  - **Breakdown rep rows:** show the rep's Rep Pace.
  - **Breakdown footer:** gives the pace, e.g. "Run the reps at 4:21-4:29/km, from your half-marathon race pace" - wording is the implementer's call.
  - **Day card (`SessionDetails`):** unchanged, because it already truncates on small screens.
- **How this works:** rewrite the existing `Pacing` section; do not add a new one. Cover:
  - Rep Paces come from your 5K Time by Daniels VDOT equivalence (sourced: the guide's "Use equivalent race paces from current fitness" and its Lactrace link).
  - The range runs from that race pace to 3% slower (10 s/km slower below 5:00/km pace), labelled *planner choice*, matching Lactrace.
  - The guide's advice: start at the slower end, reassess with a race or time trial every 4-8 weeks, and check heart rate and effort, since the paces are starting estimates.
  - Keep the line that the 5K Time should come from current fitness, not a PB or goal.

## Steps

- [ ] Add `src/planner/rep-paces.ts`: a function from 5K seconds to `Record<RepLength, { fast: number; slow: number }>` in s/km, using the Decisions formulas, plus a `m:ss` formatter. TDD it in `src/planner/rep-paces.test.ts` against these reference values (computed by the research agent and matching Lactrace's output; allow ±1 s, since Lactrace rounds speed to 0.01 km/h first):
  - 20:00 5K: VDOT ≈ 49.81; equivalent times 63:46, 1:31:50 and 2:13:38; ranges 15K 4:15-4:23, HM 4:21-4:29, 30K 4:27-4:35.
  - 25:00: fast ends 5:20, 5:27 and 5:34, each with a +10 s slow end.
  - 15:00: fast ends 3:11, 3:15 and 3:20.
- [ ] Add `fiveKSeconds: number | null` to `PlanSettings`. Add a nullable integer column to `src/db/schema.ts`, run `pnpm db:generate`, and commit the generated migration (never hand-edit `drizzle/`). Select the column in `findPlanSettings`. Existing rows get null.
- [ ] In `validate.ts`, add the `fiveKTime` error field and a check that `fiveKSeconds` is null or a positive integer, with the message e.g. "5K Time must be minutes and seconds, e.g. 19:45". Cover it in `validate.test.ts`. Update existing tests and fixtures that build `PlanSettings` to include `fiveKSeconds: null`.
- [ ] In `index.tsx`:
  - Add a `fiveKTime` string to `FormState`. `toForm` formats it from seconds, `toSettings` parses it (empty means null, malformed means NaN so validation catches it), and `samePlanSettings` compares it.
  - Add a 5K Time `Field` with a text input in the expanded section.
  - Add the paces to the collapsed summary when a 5K Time is set.
- [ ] Thread the Rep Paces to `WeekView` (e.g. pass `repPaces` or the 5K Time alongside `week`; the implementer's choice, keeping `deriveWeek` free of paces unless that is clearly simpler). Show the Rep Pace on the breakdown's rep rows and in the footer when present.
- [ ] Rewrite the `Pacing` section in `how-it-works.tsx` as described in Decisions. Render the numbers (3%, 10 s, 5:00/km cutoff) from constants exported by `rep-paces.ts` so the page cannot drift.
- [ ] Run `pnpm format`, `pnpm lint`, `pnpm typecheck` and `pnpm test`.

## Verification

- `pnpm test`, `pnpm typecheck` and `pnpm lint` pass.
- Run `pnpm db:migrate` then `pnpm dev`, and sign in.
- **No 5K Time:** the screen looks as it did before, and the breakdown footer still names the race pace.
- **Enter 20:00:** it auto-saves and survives a reload. The collapsed summary shows `15K 4:15-4:23 · HM 4:21-4:29 · 30K 4:27-4:35`. Clicking a Sub-threshold day shows the right range on each rep row and in the footer. The day card is unchanged.
- **Enter `20:75` or `abc`:** the field shows the 5K Time error and no Week renders, matching the other fields. Clearing the field removes the paces.
- **How this works:** `/how-it-works#pacing` describes the derivation, labels the range width as a planner choice, and no longer says the planner does not compute paces.
