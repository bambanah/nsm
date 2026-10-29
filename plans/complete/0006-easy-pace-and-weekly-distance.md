---
created: 2026-10-27
---

# Easy Pace and Weekly Distance from a 5K Time

## Goal

In the user's words: "I want to estimate easy pace for a given 5k time, similar to how threshold.works does. This could either be used as a target for the workout, or just as a tool for estimating weekly mileage."

So: when a 5K Time is set, the app derives an **Easy Pace** (a single per-km ceiling for easy running) and a **Weekly Distance** (an upper-bound estimate of the Week's km), shows both in the app, and explains them on How this works.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. TanStack Start (React), Tailwind v4, shadcn/ui, Drizzle on Postgres, Vitest. Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm dev` (port 3000), `pnpm test:e2e`.
- Domain glossary: `GLOSSARY.md`. The grilling session already added **Easy Pace** and **Weekly Distance** and updated **5K Time**. Use these terms in code, UI and docs, and respect the `_Avoid_` lists: never "mileage", "volume", "weekly km", "easy zone", "MAS pace" or "recovery pace".
- ADR `docs/adr/0002-nsm-sources-are-the-authority.md`: planner rules follow the method's sources, not other calculators; unsourced numbers are recorded in `docs/research/nsm-rationale.md` and labelled *planner choice* on How this works.
- Research, `docs/research/nsm-rationale.md`:
  - "Easy running" section: sirpoc, "All are the same pace roughly. 65% of MAS" (post-130, https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=6#post-130). The guide: Copeland "now prefers HR to his earlier 65%-of-maximal-aerobic-speed guideline, which can still lead runners to push too hard" (https://norwegiansingles.run/section1_core_principles.html).
  - "Planner choices" list near the end.
- threshold.works (researched this session from its JS bundle `https://threshold.works/assets/powerZones-DeFf7-aM.js`): easy pace = 1000 / (0.651 × vVO2max) s/km, where vVO2max (m/min) solves Daniels' `vo2(v) = VDOT` by Newton's method; it shows a −5/+25 s range. It does not estimate weekly distance.
- Existing code:
  - `src/planner/rep-paces.ts`: Daniels-Gilbert `vo2`, `fractionOfMax`, `vdot` (private), `repPaces(fiveKSeconds)` returning `{ fast, slow }` s/km per Rep Length, `formatDuration(seconds)` (`m:ss`), `formatRepPace`. Tests in `src/planner/rep-paces.test.ts`.
  - `src/planner/planner.ts`: `PlanSettings.fiveKSeconds: number | null`; `Day` union (`subT` with `session: SubThresholdSession` holding `repFormat`, `warmUpMinutes`, `coolDownMinutes`, `workMinutes`, `recoveryMinutes`; `easy`/`long` with `minutes`; `rest`); `Week` with `days` and `totalMinutes`; `deriveWeek(settings, sessionChoices)`.
  - `src/routes/index.tsx`: computes `paces` from `settings.fiveKSeconds` (around line 134). The settings panel has a "Paces" `Section` with the 5K Time input and one `Row` per Rep Length showing its Rep Pace (around line 217). Passes `repPaces` to `WeekView`.
  - `src/components/week-view.tsx`: `WeekView` renders `Stat` tiles, the first being `Total` (`clock(week.totalMinutes)`, detail `N min`). `steps(day, repPaces)` builds the breakdown rows; rep rows carry `pace`; easy and long days produce one row labelled "Easy pace"; sessions produce Warm-up and Cool-down rows without a pace.
  - `src/sync/workouts.ts`: Synced steps target `60-70% HR` (`EASY_HR_PERCENT`). Not to be changed.
  - `src/routes/how-it-works.tsx`: `Section id="pacing"` (around line 224) covers Rep Paces and the easy HR target; constants are rendered from code so the page cannot drift.
- Owner's global instructions: YAGNI absolutely; sparse comments only where they earn their place; plain "-", never em dashes; commit messages are a title only; ask before pushing.

## Decisions

- **Easy Pace is 65% of MAS, sourced from sirpoc (post-130).** Not copied from threshold.works, per ADR 0002; threshold.works happens to use the same rule (0.651) and serves as a cross-check.
- **MAS is estimated as Daniels' vVO2max**: the speed v (m/min) at which `vo2(v)` equals the runner's VDOT from their 5K Time. Reuses the VDOT already computed for Rep Paces. This estimate is a *planner choice* (the sources don't say how to estimate MAS). Rejected: 1500m race pace (~10-13 s/km faster), 3000m race pace (within a few seconds, but needs an extra equivalence step).
- **A single value, not a range.** It is a ceiling: roughly the fastest an easy run should go, not a goal. threshold.works' −5/+25 s band is unsourced and rejected.
- **Applies to Easy Runs, Long Runs, warm-ups and cool-downs** alike ("All are the same pace roughly").
- **Optional and per km only**, exactly like Rep Paces: with no 5K Time, nothing new appears and the app behaves as today.
- **Display:** whole seconds, `m:ss/km`, using `formatDuration`.
- **Where Easy Pace appears:**
  - The settings "Paces" section: an "Easy pace" row alongside the Rep Pace rows.
  - The day breakdown: the easy row of Easy and Long days, and the Warm-up and Cool-down rows of Sub-threshold Sessions, carry the Easy Pace like rep rows carry their Rep Pace.
  - Day cards unchanged.
- **Not Synced.** intervals.icu steps keep HR as the only target, and no note line is added; the guide says Copeland prefers HR over pace for easy running.
- **Weekly Distance is one total per Week**, shown with the Week's total time (e.g. in or beside the `Total` stat; exact placement is the implementer's call). No per-day distance. Shown only when a 5K Time is set.
- **Weekly Distance formula:** easy minutes (Easy Runs, Long Run, warm-ups, cool-downs) at Easy Pace, plus rep minutes at the midpoint of their Rep Length's Rep Pace (`(fast + slow) / 2`), with Recoveries counted as zero distance. Because Easy Pace is a ceiling, the total is an upper bound; display it with "≈", rounded to whole km, e.g. `≈ 68 km`.
- **How this works:** extend the existing `Pacing` section with an Easy Pace paragraph (sirpoc's 65% of MAS, sourced; MAS as Daniels' vVO2max, *planner choice*; a ceiling, not a goal; Copeland now prefers the 70% HRmax cap, which is why Synced workouts keep HR) and a Weekly Distance paragraph (upper-bound estimate, Recoveries counted as no distance, reps at the middle of their Rep Pace). No new section.
- **No ADR.** Everything here is easy to reverse.

## Steps

- [x] In `src/planner/rep-paces.ts`, add `easyPace(fiveKSeconds): number` (s/km) and an exported constant for the 65% (`EASY_PACE_MAS_PERCENT = 65` or similar) so How this works can render it. Solve `vo2(v) = vdot(5000, t)` for v (the quadratic has a closed form, or bisect like `equivalentMinutes`), then pace = `1000 / (v × 0.65) × 60`. TDD it in `rep-paces.test.ts` (allow ±1 s): 15:00 → about 4:31, 20:00 → about 5:55, 25:00 → about 7:19 (threshold.works, at 0.651, gives 4:30, 5:55, 7:19).
- [x] Add a pure `weeklyDistanceKm(week, fiveKSeconds)` (or taking the Easy Pace and Rep Paces; implementer's call) next to the pace code or in the planner, following the formula above. Test it against a hand-computed Week, including that Recoveries contribute nothing.
- [x] In `src/routes/index.tsx`, add an "Easy pace" `Row` to the "Paces" section when a 5K Time is set, and pass the Easy Pace to `WeekView` alongside `repPaces`.
- [x] In `src/components/week-view.tsx`, give the easy, Warm-up and Cool-down breakdown rows the Easy Pace, and show `≈ N km` Weekly Distance with the `Total` stat when a 5K Time is set.
- [x] Rewrite/extend the `Pacing` section in `src/routes/how-it-works.tsx` as described in Decisions, rendering numbers from exported constants.
- [x] In `docs/research/nsm-rationale.md`, note under "Easy running" that the planner's Easy Pace is 65% of MAS with MAS as Daniels' vVO2max, and add "MAS estimated as Daniels' vVO2max" and "Weekly Distance counting Recoveries as no distance and reps at the middle of their Rep Pace" to the "Planner choices" list.
- [x] Run `pnpm format`, `pnpm lint`, `pnpm typecheck`, `pnpm test`, and `pnpm test:e2e` (update e2e specs in `e2e/app.spec.ts` if they assert on the Paces section or stats).

## Verification

- Unit tests pass, including the Easy Pace reference values and the Weekly Distance case.
- In `pnpm dev`, with a 20:00 5K Time: the Paces section shows `Easy pace 5:55/km`; an Easy Run's breakdown row and a session's Warm-up and Cool-down rows show `5:55/km`; the Week shows a whole-km `≈` Weekly Distance.
- Clearing the 5K Time removes the Easy pace row, the breakdown easy paces and the Weekly Distance.
- A Synced workout's description is unchanged (`src/sync/workouts.test.ts` still passes untouched).
- How this works' Pacing section explains Easy Pace and Weekly Distance with the *planner choice* labels.
