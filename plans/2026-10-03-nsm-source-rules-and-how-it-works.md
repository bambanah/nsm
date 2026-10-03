---
created: 2026-10-03
---

# Align the planner with NSM sources, then document how a Week is built

## Goal

Runners should be able to see how the app builds a Week, especially the Sub-threshold Sessions, and which "rules" it applies (Sub-threshold Share, session sizing, Long Run length, etc.). In the user's words, the docs should capture "the rules and equations used that are essentially our interpretation of how to implement the method in a repeatable way". Some of that belongs in a "How this works" page, some in tooltips on the planner screen.

Researching the rules showed that several of them, inherited from threshold.works, disagree with the method's primary sources. The user's principle: where the threshold.works starting point disagrees with the source material, adapt to satisfy the source material. So the planner changes first, then the docs describe the corrected rules.

## Context

- Project root: `/Users/lachlanunderhill/git-personal/nsm`. TanStack Start (React) + Tailwind v4 + shadcn/ui, Vitest. Commands: `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`, `pnpm dev` (port 3000).
- Domain glossary: `CONTEXT.md`. Already updated in the grilling session for the new rules (Weekly Duration 5-9h, always three Sub-threshold Sessions, Recovery, Sub-threshold Work, Sub-threshold Share, Long Run ~1.7× Easy Run). Use its terms in code, UI and docs; respect the `_Avoid_` lists.
- ADRs: `docs/adr/0001-weeks-derived-not-stored.md`; `docs/adr/0002-nsm-sources-over-threshold-works.md` records the principle behind this plan.
- Research: `docs/research/threshold-works-model.md` (the reverse-engineered model the planner was ported from) and `docs/research/nsm-rationale.md` (what norwegiansingles.run and sirpoc's posts say about each rule and why, with quotes and URLs; use it for the one-line rationales on the page).
- Planner: `src/planner/planner.ts` (`deriveWeek`, `selectRepFormats`, `sessionCount`, `toSession`, `mergeShortEasyRuns`, spacing helpers), `src/planner/rep-formats.ts` (`REP_FORMATS`, `workMinutes`), `src/planner/validate.ts` (`validatePlanSettings`). Tests: `src/planner/planner.test.ts`, `src/planner/validate.test.ts` - several assert old constants (240/600 min, 2 sessions at 240, cap 25 at 240, Long Run 75/135) and must be updated to the new rules.
- UI: `src/routes/index.tsx` (auth-guarded planner screen: Plan Settings summary/edit form, `Weeks` tabs; Weekly Duration hours input has `max={10}`), `src/components/week-view.tsx` (stat cards, `DayCell`, `SessionDetails` with a `title` attribute that is today's only in-app explanation). No tooltip/popover component exists yet. Routes are file-based under `src/routes/` (`routeTree.gen.ts` is generated - never hand-edit it; it regenerates when `pnpm dev` or `pnpm build` runs).
- Weekly Duration is stored as integer minutes (`src/db/schema.ts`), so the range change needs no migration. Saved Plan Settings outside 5-9h will show validation errors until edited; accepted.
- The owner's global instructions apply: YAGNI absolutely, sparse comments, plain "-" never em dashes, commit messages title-only, ask before pushing.

## Decisions

### Planner rule changes (sources override threshold.works, ADR 0002)

- **Weekly Duration 5h-9h** (300-540 min), was 4h-10h. Sources say the method suits ~5-8.5/5-9 h/week; sirpoc says under ~5h it isn't worth it. Validation message `Weekly Duration must be between 5h 0m and 9h 0m`; hours input `max={9}`.
- **Always three Sub-threshold Sessions.** At 5h the 23% budget is 69 min, so the old `budget < 60 ? 2 : 3` switch never fires; delete it and the two-session selection branch. Sources tie two sessions to being new to intensity, not to volume. No "sessions per week" setting (YAGNI); the page mentions beginners can swap one session for an Easy Run at first.
- **Sub-threshold Share target tapers above 7h**: 23% up to 420 min, then linearly to 20% at 540 min (`23 - 3 × (W - 420) / 120`). Tolerance stays ±1.5 points around that target. Sources: "As volume rises, quality may settle nearer 20-22% ... Do not keep extending workouts just to preserve 25%." Rejected: capping sessions at 35 above 7h (undershoots to ~17.5%), planning easy doubles (a new feature).
- **Per-session work cap**: 35 min up to 7h, uncapped above (the taper limits growth: 9h → 108 min ≈ 36/session). The 25-min tier for ≤5h is dropped - with a 5h minimum it applied only at exactly 5h0m.
- **Recovery by Rep Length**: 15K 1 min, HM 1 min, 30K 2 min (whole minutes, within the guide's 60 s / 60-90 s / 90-120 s ranges). Session minutes = work + (reps - 1) × recovery + warm-up + cool-down. Rejected: fixed 1 min (shorter than the guide for long reps), fractional midpoints (non-integer totals).
- **Long Run = 1.7 × an Easy Run**, clamped 75-105 min. Solve jointly before merging: `E0 = (W - sessionMinutes) / (easyDayCount + 1.7)`, `L = clamp(round(1.7 × E0), 75, 105)`, then Easy Runs = `round((W - sessionMinutes - L) / easyDayCount)` as now. Was `clamp(round(25% × W), 75, 135)`. The 75 floor (a planner choice; the guide's smallest example is 75-80) means 1.7× visibly does not hold at the low end; accepted. Rejected: lower or no floor (a ~45 min "long run"), 20%-of-week formula.
- **Closest attempt wins**: when no draw lands within tolerance after the attempts run out, use the draw closest to the target, not the last one. Implementer chooses how to restructure the loop (attempts also `continue` on failed day placement).
- **Kept as planner choices** (unsourced but not contradicted; labelled as such on the page): the 23% base target and ±1.5 tolerance, the 35-min cap, merging Easy Runs ≤25 min into Rest Days (still triggers at 5h, e.g. ~17 min Easy Runs with 15/15 warm-up/cool-down), random 30K pick then 15K/HM closest to half the remainder, Tue/Thu/Sat preference and non-adjacent sessions, Long Run on Sunday then Saturday.
- **Session-to-day order stays shuffled.** The guide's long Tue / medium Thu / short Sat is only an example; mixing is for variety.
- **Export the numbers** the docs need as named constants from the planner (base share, taper, tolerance, cap, recoveries, Long Run ratio and bounds, merge threshold, Weekly Duration bounds) instead of inline magic numbers, so the page renders them and cannot drift.
- **Mark merged Rest Days**: `Day` distinguishes a requested Rest Day from one produced by the merge (e.g. `{ type: 'rest', merged: true }`), so the merged-rest tooltip can show only on the latter.

### How this works page

- Audience: runners who know NSM roughly (e.g. from norwegiansingles.run) but not how this app turns it into a Week. Not an NSM primer: the intro links to https://norwegiansingles.run/ for the method.
- Content is mechanics at a high level - rules that decide what lands in a Week, with formulas - plus a one-line "why" only where a rule would look arbitrary, drawn from `docs/research/nsm-rationale.md`. Skip search internals (attempt counts, retry procedure); one line covers "if it can't hit the target it uses the closest attempt".
- Rules from the sources get their one-line rationale; planner choices are marked as such, e.g. "NSM suggests 20-25%; the planner aims for 23%." Static text - no per-user numbers on the page.
- Separate public route `/how-it-works` (no sign-in required, unlike the planner: it holds no user data and is written for any runner), linked from the planner header. Link back to the planner from the page.
- Outline, in the order the planner builds a Week:
  1. Intro: what the app does; link to norwegiansingles.run; one line crediting the threshold.works Plan Generator (https://threshold.works/plangenerator) as the starting point (no list of differences).
  2. Sub-threshold budget: Sub-threshold Work and Sub-threshold Share (reps only; warm-ups, cool-downs and Recoveries count as easy time), 23% target tapering to 20% from 7h to 9h, ±1.5.
  3. Sub-threshold Sessions: always three; 35-min cap up to 7h; one random 30K session plus 15K and HM sessions sized to fill the remainder; Recoveries by Rep Length; a table of all Rep Formats rendered from `REP_FORMATS`; beginners may swap one for an Easy Run at first.
  4. Placing the days: non-adjacent (Sun→Mon counts), Tue/Thu/Sat preferred; which session lands where varies.
  5. Long Run: 1.7 × an Easy Run, never under 75 or over 105 min; Sunday, else Saturday.
  6. Easy Runs and Rest Days: the remaining time split evenly; Easy Runs of 25 min or less merged in pairs, freed days become Rest Days. Around 8h+ the sources suggest easy doubles; the app plans one run per day.
  7. Day Preferences: what each option does; limits (max 2 Rest, max 2 Easy, max 1 Long, max 3 SubT, SubT days non-adjacent).
  8. Pacing: one short paragraph - Rep Length names the race pace; set it from current fitness, not a PB or goal; link to norwegiansingles.run for heart-rate and effort guidance. The app does not compute paces.
  9. Shuffle: why consecutive Weeks differ and what Reshuffle does.

### Tooltips

- Interaction: the explained element itself is the trigger (dotted underline), opening a Popover on hover (mouse) and tap (touch). Rejected: ⓘ icons (clutter the Week grid), hover-only tooltips (fail on phones). Add shadcn Popover (`pnpm dlx shadcn@latest add popover`); Radix Popover is click-only, so open it on pointer enter/leave for mouse pointers.
- Each tooltip is one line plus a "More →" link to the matching `/how-it-works` section anchor.
- The set (Weekly Duration field tooltip rejected - that belongs on the page):
  - Sub-threshold share stat: reps ÷ total time, target for this Weekly Duration.
  - Sub-threshold work stat: reps only, excludes warm-up, cool-down and Recoveries.
  - Rep Length label (`@15K`, `@HM`, `@30K`): the race pace it names.
  - Sub-threshold Session total minutes: personalised breakdown - warm-up + reps + (reps - 1) × Recovery + cool-down with the real numbers.
  - Long Run minutes: personalised - 1.7 × the Easy Run with real numbers, or that it was raised/lowered to the 75/105 bound. Expose whatever the planner needs on `Week` for this.
  - Merged Rest Day: Easy Runs here would have been ≤25 min, so two were combined. Only on merged Rest Days.
  - Day Preferences label: what Default means, and the limits.

## Steps

- [ ] Planner: export named constants; Weekly Duration 300-540; remove `sessionCount` and the two-session branch (always 3); taper target above 420 min; drop the 25-min cap tier; Recovery by Rep Length in `toSession`; Long Run 1.7× solve with 75-105 clamp; closest-attempt fallback; mark merged Rest Days.
- [ ] Validation: new duration bounds and message; SubT preference maximum is a fixed 3 (no `sessionCount`).
- [ ] Update `planner.test.ts` and `validate.test.ts` to the new rules (durations, session count, caps, Long Run values, recoveries, taper, closest attempt, merged flag); test-first where practical.
- [ ] UI: hours input `max={9}`; Week view unchanged otherwise until tooltips.
- [ ] Add shadcn Popover and a small explained-term wrapper (dotted underline, hover + tap, "More →" link).
- [ ] Add the tooltips listed above to `week-view.tsx` and the Day Preferences label in `index.tsx`.
- [ ] Add a public `src/routes/how-it-works.tsx` (no auth `beforeLoad`) with the outline above, rendering numbers and the Rep Format table from planner exports, section ids matching the tooltip links; link it from the planner header.
- [ ] Run `pnpm test`, `pnpm typecheck`, `pnpm lint`, `pnpm format`.

## Verification

- `pnpm test` passes with tests asserting: 300/540 bounds, three sessions at every duration, share within ±1.5 of the tapered target (23% ≤7h, 20% at 9h) or the closest attempt, Long Run 75 at 5h and ≤105 at 9h, 30K session minutes include 2-min Recoveries, merged Rest Days flagged.
- `pnpm dev`, sign in: hours cannot exceed 9; a 4h or 10h value shows the new error. Every tooltip opens on hover and on tap (mobile width), shows correct personalised numbers for session breakdown and Long Run, and its "More →" lands on the right `/how-it-works` section. The page's numbers and Rep Format table match the planner constants.

## Open questions

- Future idea, not in scope: a per-day "Rep Length preference" so a runner can pin which session lands on which day (raised by the user when keeping the shuffle).
