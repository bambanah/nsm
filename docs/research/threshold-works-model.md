# threshold.works weekly plan model

Reverse-engineered specification of the weekly training plan calculator at https://threshold.works/plangenerator ("Plan Generator", the public Norwegian Singles Method calculator). Extracted from the production JS bundles fetched on 2026-10-02. All constants, strings and orderings below are taken directly from the minified source; verbatim snippets are in the appendix. Worked examples were produced by importing the site's own `weeklyTraining` module unmodified into Node with a seeded `Math.random`.

## Sources

- Entry HTML: https://threshold.works/ (loads `/assets/index-D83xkg7O.js`; routes include `/plangenerator`, `/dashboard`, `/weekly-plan-test`).
- Planner core (duration mode, validation, interval library): https://threshold.works/assets/weeklyTraining-BAoSQQik.js (11,283 bytes, no imports, self-contained).
- Plan Generator page (inputs, UI validation, rendering, pace display): https://threshold.works/assets/PlanGenerator-DYzr_jIM.js
- Distance-mode planner, pace/VDOT/power helpers, unit constants: https://threshold.works/assets/powerZones-DeFf7-aM.js
- Logged-in dashboard (second caller of the same planner): https://threshold.works/assets/Dashboard-DOin6bK5.js
- Test page calling the planner with defaults: https://threshold.works/assets/WeeklyPlanTest-cVLTO6gE.js
- Duration formatter `od` lives in https://threshold.works/assets/index-D83xkg7O.js

Filenames are content-hashed and will change on redeploy; find the current names by grepping the entry bundle for `weeklyTraining-`.

## Overview

The planner is one function, `generateWeeklyPlan(weeklyMinutes, subTPercent = 23, restDays = ["monday"], dayPreferences, warmupMin = 10, cooldownMin = 10)` (minified `ht`, exported as `g`). In outline: validate inputs, then up to 30 attempts of: pick 2 or 3 sub-threshold (SubT) interval sessions from a fixed library to approximate a SubT minute budget; accept the attempt if work minutes are within 1.5 percentage points of the target share (or it is the 30th attempt); place SubT days, the long run, rest days and easy days; split remaining minutes evenly over easy days; merge short easy days into rest days. The result is randomised (see Ambiguities).

## Inputs

### Duration mode (default mode; the focus of this spec)

- Weekly duration: two integer fields, "Hours per week" (HTML min 0, max 10, placeholder "0-10") and "Minutes per week" (min 0, max 59, placeholder "0-59"). Keystrokes are accepted only if they match `/^\d*$/` and `parseInt(value) <= max` (10 or 59), otherwise the keystroke is ignored. If hours is non-empty and minutes is empty, minutes becomes "00" (on change, on blur and at submit). Total = `(parseInt(hours)||0)*60 + (parseInt(minutes)||0)`. Valid range 240 to 600 inclusive. No default value (both fields start empty).
- SubT share (`subTPercentage`): a planner parameter, but there is NO UI control for it. Plan Generator form state is initialised to 23 and never changed; the logged-in Dashboard also uses `useState(23)` and only resets it to 23. Effectively always 23. The function default is also 23.
- Warm-up and cool-down minutes: hidden behind a "Configure" toggle under "Warmup & Cooldown". Number inputs with HTML min 5, max 20 (step 1, not enforced in JS); `onChange` stores `parseInt(value) || 10`, so empty or 0 becomes 10, and values outside 5 to 20 typed directly are accepted as-is. Defaults 10 and 10. Collapsed summary text: `Current: ${wu}min warmup, ${cd}min cooldown`. Persisted to localStorage key `planGeneratorPreferencesV2` via "Save Preferences". The Dashboard always calls the planner with 10 and 10 (it rewrites descriptions afterwards from its own workout configuration).
- Weekly day preferences: hidden behind "Configure" under "Weekly Day Preferences" with help text `Customize which days should be rest, easy, long, or SubT workouts. Leave as "Default" to let the algorithm decide.` One select per weekday Monday to Sunday with options Default, Rest, Easy, Long, SubT (values `default`, `rest`, `easy`, `long`, `subT`). Selecting Default deletes the key, so the preferences object only holds explicit choices; it starts as `{}`. Displayed constraint list: "Max 2 rest days", "Max 2 easy days", "Max 1 long day", "2-3 SubT days", "No adjacent SubT days" (the 2-3 minimum is not enforced anywhere).
- Plan mode toggle: "Duration-based" (default) or "Distance-based". Switching clears weekly hours, minutes and distance and any generated plan.
- Units: checkbox "Use Imperial Units (miles, feet)" (default off). In duration mode it only affects pace display (/km vs /mile). In distance mode it changes weekly distance input to miles.
- Benchmark (needed only for pace display, but required to submit in pace mode): "Pace Benchmark" with distance select 5K (5000 m), 10K (10000), 15K (15000), Half Marathon (21097.5), Marathon (42195) or Custom Distance (metres), plus race time HH/MM/SS (form default hours "00"); or "Power Benchmark" with Critical Power 100 to 600 W.

### Distance mode (secondary)

- Weekly distance: one decimal field, km (HTML min 50, max 130, step 0.1) or miles (min 31, max 81). Miles are converted with `km = mi * (1 / 0.62137119)`. Valid range 50 to 130 km after conversion.
- Warm-up and cool-down km: min 1, max 5, step 0.5, `parseFloat(value) || 2`, defaults 2 and 2.
- SubT share: 23 passed in (function default 25).

## Validation and error messages

Order at submit in the Plan Generator (first failure is shown as the error and nothing is generated):

1. Benchmark. Pace mode: hours/minutes/seconds parsed with `parseInt(x)||0`; "Minutes and seconds must be less than 60" if minutes >= 60 or seconds >= 60; "Time values cannot be negative"; "Please enter a valid race time" if all zero. Power mode: "Please enter a valid Critical Power between 100-600 watts" if CP is NaN, < 100 or > 600; then the same < 60 and negative checks only if any time component is non-zero.
2. Day preferences, via `validateDayPreferences` (below). Message shown is the violations joined with ", " (no prefix).
3. Duration mode: "Invalid weekly duration values" if hours < 0, minutes < 0 or minutes >= 60; "Weekly duration must be between 4 hours (240 minutes) and 10 hours (600 minutes)" if total < 240 or > 600. Distance mode: "Please enter a valid weekly distance" if NaN; "Weekly distance must be between 50km and 130km" (metric) or "Weekly distance must be between 31 and 81 miles" (imperial) if km < 50 or > 130.
4. Planner exceptions are shown verbatim (`error.message`, fallback "Error generating weekly plan").

`validateDayPreferences(prefs)` (minified `rt`):

- Count each non-`default` value. Constants `{maxRestDays: 2, maxEasyDays: 2, maxLongDays: 1, maxSubTDays: 3}`.
- Violations pushed in this order: `Maximum 2 rest days allowed (you have N)`, `Maximum 2 easy days allowed (you have N)`, `Maximum 1 long day allowed (you have N)`, `Maximum 3 SubT days allowed (you have N)`.
- Adjacency: take the weekday indices (Monday 0 to Sunday 6) whose preference is `subT`, in order; if any consecutive pair differs by exactly 1, push `Preferred SubT days cannot be on adjacent days.` once. Sunday and Monday are NOT treated as adjacent here (no wrap-around).
- Returns `{isValid: violations.length === 0, violations}`.

Planner-level checks (thrown as `Error`):

- `Weekly duration must be between 4 hours (240 minutes) and 10 hours (600 minutes)` if minutes < 240 or > 600.
- If a preferences object is passed (any object, including `{}`): `Invalid day preferences: ` + violations joined with ", ". Otherwise (preferences `undefined`) the legacy `restDays` array is used: `Maximum 2 rest days allowed` if more than 2, and each listed day becomes `rest`.
- `Sub-threshold duration cannot be less than 48 minutes. Please increase weekly duration or percentage.` if the SubT budget < 48 (unreachable at 23% since 240 min gives 55).
- `Could not generate a plan within 1.5% error rate after 30 attempts` if all 30 attempts end in `continue` (see Placement); in practice only when SubT placement can never satisfy spacing, e.g. SubT preferred on both Sunday and Monday.

Important: the Plan Generator and Dashboard always pass the preferences object (default `{}`), so the legacy default of resting on Monday is NOT applied on the website. With all days on Default there are no preset rest days; rest days only appear via the easy-day merge rule. Only the `/weekly-plan-test` page (which calls `generateWeeklyPlan(420)`) gets a Monday rest day.

## Interval library

Each entry: type, reps, minutes per rep (`duration`), work minutes (`totalDuration` = reps x duration), pace label. Order matters for tie-breaking (closest-match picks the earliest).

Short (pace label `15K`), in order: 7x3 (21), 8x3 (24), 8x4 (32), 9x3 (27), 9x4 (36), 10x3 (30), 10x4 (40), 11x3 (33), 11x4 (44), 12x3 (36), 12x4 (48).

Medium (pace label `Half Marathon`), in order: 3x6 (18), 4x6 (24), 4x7 (28), 4x8 (32), 5x6 (30), 5x7 (35), 5x8 (40), 6x6 (36), 6x7 (42), 6x8 (48).

Long (pace label `30K`), in order: 2x10 (20), 2x11 (22), 2x12 (24), 3x10 (30), 3x11 (33), 3x12 (36).

Custom (never auto-selected, `excludeFromAutoSelection: true`; only offered in the per-day interval dropdown after generation): "Bakkens' 45/15" 15 reps (`duration` 0.75, total 15, 45 s on / 15 s off, 5 @10K, 5 @8K, 5 @5K), "Bakkens' 45/15" 25 reps (total 25, 8/8/9), "90s @ 10K" 15 reps (`duration` 1.5, total 22.5, 30 s recovery), "90s @ 10K" 25 reps (total 37.5).

Identity key for de-duplication: `${type}-${reps}-${duration}`.

## SubT session selection (`selectSubTWorkouts(weeklyMinutes, pct)`, minified `ut`)

1. Budget `B = Math.round(weeklyMinutes * (pct / 100))`. If `B < 48` throw (see above).
2. Per-session work cap by weekly hours `h = weeklyMinutes / 60`: `h <= 5` gives cap 25; `h <= 7` gives cap 35; otherwise no cap. The cap filters each library by `totalDuration <= cap` (work minutes only, excluding recoveries, warm-up, cool-down). So 240 to 300 min uses cap 25, 301 to 420 cap 35, 421 to 600 uncapped.
3. Session count `n = B < 60 ? 2 : 3`. At 23% this means 240 to 258 min gives 2 sessions and 259 to 600 gives 3.
4. Long session: uniform random pick from the capped long list (fallback to the full long list if the capped list is empty, which cannot happen since 2x10 = 20). Remainder `R = max(0, B - long.totalDuration)`.
5. If `n == 2`: candidates = capped short list followed by capped medium list, minus already-used keys (fallback: uncapped short+medium filtered by cap and unused, which is the same set). If `R > 0` pick the candidate minimising `|totalDuration - R|`, ties go to the earliest candidate (reduce with strict `<`). If `R == 0` pick uniformly at random. Result is `[long, second]`.
6. If `n == 3`: `targetShort = targetMedium = Math.round(R * 0.5)`. `pick(target, list, used)`: drop used entries; if none left return null; if `target <= 0` return a uniform random entry; else closest by `|totalDuration - target|`, ties to the earliest. Pick short from the capped short list (if non-empty), mark used; pick medium from the capped medium list (if non-empty), mark used. Fallbacks if either is null: pick from the auto-selectable pool (all short, medium, long in library order) filtered by cap, closest to its target; if still null, random unused from that pool (or random from the pool). Then if no medium was selected and the capped medium list has unused entries, replace a random non-long session with a random unused medium (effectively unreachable since the capped medium list always contains 3x6 = 18). Result is `[long, short, medium]`.
7. Shuffle the sessions with Fisher-Yates (`Math.random`). This order determines which SubT day gets which session.

So in the normal case: 2 sessions = one random long + the short-or-medium closest to the remainder; 3 sessions = one random long + the short closest to half the remainder + the medium closest to half the remainder.

## Main planner (`generateWeeklyPlan`, minified `ht`)

Constants: `RECOVERY_MIN = 1` per rep gap, max attempts 30, tolerance 1.5 percentage points, short-easy threshold 25 min.

Per attempt (attempt counter increments first):

1. `sessions = selectSubTWorkouts(weeklyMinutes, pct)`; `work = sum(totalDuration)`; `share = work / weeklyMinutes * 100`.
2. If `|share - pct| > 1.5` and this is not attempt 30, start the next attempt. Otherwise proceed with this draw (attempt 30 is accepted regardless of share).
3. `recoveries = sum((reps - 1) * 1)`; `wucd = warmup + cooldown`; `subTDayTotal = work + recoveries + wucd * sessions.length`.
4. Partition weekdays (Monday to Sunday order) by preference: `restPref`, `easyPref`, `longPref`, `subTPref`, and `defaultDays` (no key or `default`).
5. Rest days = `restPref` (never adds others at this stage).
6. SubT days = first `sessions.length` entries of `subTPref` (Monday-first). If more are needed (`need = sessions.length - chosen`), candidates = `defaultDays` minus rest and chosen SubT days (easy/long/extra-subT preferred days are never candidates). If some SubT days are already chosen use `findSpacingWithExisting(candidates, need, chosen)`, else `findSpacing(candidates, need)` (see SubT day placement). Append, then sort SubT days Monday-first.
7. If the SubT day set fails `isWellSpaced` (no two consecutive weekdays, and not both Sunday and Monday), `continue` to the next attempt.
8. Long day: `available` = all weekdays not rest and not SubT. If `longPref[0]` is in `available` use it; else Sunday if available; else Saturday if available; else a random available day (`[...available].sort(() => Math.random() - .5)[0]`). If none, `continue`.
9. Long run minutes `L = min(max(Math.round(weeklyMinutes * 0.25), 75), 135)`.
10. Easy days, in this order: `easyPref` days that are not rest, not long and not SubT (Monday-first), then all remaining days that are not rest, long, SubT or already listed, Fisher-Yates shuffled.
11. `easyEach = count > 0 ? Math.round((weeklyMinutes - subTDayTotal - L) / count) : 0`. Every easy day gets the same value.
12. Build output: SubT day i (Monday-first) gets session i of the shuffled list: `duration = work_i + (reps_i - 1) * (recoverySeconds ?? 60) / 60 + wucd` (for auto-selected sessions this is `work_i + reps_i - 1 + wucd`; custom Bakken sessions would add no recovery), description `${warmup}m warmup, ${reps}×${duration}min @${paceTarget}, ${cooldown}m cooldown`, plus `subTWorkout` (the library entry). Easy days `{type: "easy", duration: easyEach, description: `${easyEach}min easy run`}`. Long `{type: "long", duration: L, description: `${L}min long run`}`. Rest `{type: "rest", duration: 0, description: "Rest Day"}`. Assignment order is SubT, easy, long, rest (later writes win; sets are disjoint).
13. Merge rule (below), then return.

### SubT day placement

`isWellSpaced(days)`: true if at most one day; false if any two are consecutive weekdays (by Monday-first index); false if the set contains both Sunday and Monday (wrap-around); else true.

`findSpacing(candidates, k)` (no SubT preferences chosen yet): if `k == 1` return the first candidate. Preferred set: Tuesday, Thursday, Saturday filtered to those in `candidates` (in that order); if at least `k` of them, take the first `k` and return them if well spaced (always true). Otherwise up to 50 random tries of `[...candidates].sort(() => Math.random() - .5).slice(0, k)`, returning the first well-spaced one. Otherwise `maxSpacing(candidates, k)`.

`findSpacingWithExisting(candidates, k, existing)`: if `candidates.length < k` return `maxSpacing(candidates, k)`. Enumerate all k-combinations of candidates (lexicographic recursion), shuffle the list with `sort(() => Math.random() - .5)`, and return the first combination that is well spaced together with `existing`. If none, log a console warning and return `maxSpacing(candidates, k)` (which may produce a badly spaced set, causing that attempt to `continue`).

`maxSpacing(candidates, k)`: if `k == 0` return []; if `k == 1` return the first candidate; else map to indices, sort, take index 0 then repeatedly step `Math.floor(len / k)` positions (clamped to the last), dedupe, fill with the earliest unused if short, sort and map back. May return fewer than `k` days if there are not enough candidates.

Net effect with no preferences: 2 sessions go on Tuesday and Thursday, 3 sessions on Tuesday, Thursday and Saturday; long run Sunday.

### Easy-day merge rule

Threshold `SHORT = 25`. Repeatedly: collect easy days in output key order (insertion order: SubT days, then easy days in step-10 order, then long, then rest), stable-sort by duration ascending, split into `short` (duration <= 25) and `longer` (> 25). While `short.length > 1`: remove the first short day `e`; target is the next short day if there is one and its duration <= the first longer day's (always true when another short day exists, so the `longer` branch is effectively dead code); add `e.duration` to the target and rewrite its description to `${duration}min easy run`; turn `e` into `{type: "rest", duration: 0, description: "Rest Day"}`; recompute. A single remaining short easy day is left alone. Because all easy days start equal, at low volume this halves the easy days (pairs merged), e.g. 4 x 17 becomes 2 x 34 plus 2 extra rest days. The first day in step-10 order is merged away first, so easy-preferred days are the first to become rest days. There is no cap on the resulting number of rest days.

### Returned object and what the page shows

Returned: `{totalDuration: weeklyMinutes, subTDuration: work, subTPercentage: work / weeklyMinutes * 100, monday..sunday: {type, duration, description, subTWorkout?}}` (day keys in insertion order, not weekday order).

The Plan Generator then overwrites `subTPercentage = subTDuration / sum(duration of non-rest days) * 100`, and the summary cards are recomputed from the days: "Total Weekly Duration" = sum of non-rest day durations (can differ from the input by easy-day rounding), formatted `${h}h ${m}m (${t} minutes)` (or `${h}h (${t} minutes)` when m is 0, `${m}m (${t} minutes)` when h is 0); "SubT Duration" = sum of `subTWorkout.totalDuration` (work only) in the same format; "SubT Percentage" = `Math.round(p * 10) / 10` shown with `toFixed(1)` and "%".

"Weekly Schedule" renders Monday to Sunday. Each card shows the weekday label and a type label: `Sub-t`, `Rest`, `Easy`, `Long`.

- SubT card: three blocks. "Warm-up": `${warmup}min easy pace`. "Sub-t block": an interval dropdown whose current label is `${reps}×${duration}min @${paceTarget} (${totalDuration}min total)`, the line "1min rest in between", and `Target Pace: ${pace range}/km` (or /mile) when a pace benchmark exists, or a power range in power mode. "Cooldown": `${cooldown}min easy pace`. The card does not display the SubT day's total duration (it is only used in totals and the CSV).
- Easy and Long cards: the description text, an editable "Duration" field in min (validation 10 to 180: "Minimum 10 minutes", "Maximum 180 minutes", "Please enter a valid number"), and `Target Pace: ` easy range.
- Rest card: "Rest day - recover and restore".

Post-generation edits (not part of the planner): swapping a day's interval recomputes that day's duration as `work + (reps - 1) * (recoverySeconds ?? 60) / 60 + warmup + cooldown` (Bakken: `work + warmup + cooldown`) and rewrites the description; editing easy/long durations changes totals. CSV export columns: Day, Type (SubT/Rest/Easy/Long), Warm-up (`${wu}min easy pace`), Main Workout (`Repeat ${reps}×${duration}min @${pace} pace (1min rest)` or the description), Cooldown, Target Pace, [Power Target], Duration (min), Distance (km or mi), Customized (Yes/No).

## Pace labels and target paces (display only)

Session pace labels are fixed by type: short `15K`, medium `Half Marathon`, long `30K`. They do not affect planning. Target paces shown in the UI come from the benchmark:

- Race predictions for 1 Mile (1609.34 m), 3K, 5K, 8K, 10K, 15K, Half Marathon (21097.5), 30K, Marathon (42195): Riegel `t2 = t1 * (d2 / d1) ^ 1.06` with t in minutes, formatted `h:mm:ss` or `m:ss` (seconds from `Math.round(frac(t) * 60)`).
- SubT pace: parse the prediction for the session's label back to seconds, `secPerKm = seconds / (metres / 1000)`, display range `fmt(secPerKm)` to `fmt(secPerKm + 10)` where `fmt` rounds seconds and rolls 60 to the next minute. Imperial divides sec/km by 0.62137119 per end.
- Easy pace (easy and long days): VDOT via Daniels (`v = d / tmin`, `VO2 = -4.6 + 0.182258 v + 0.000104 v^2`, `%max = 0.8 + 0.1894393 e^(-0.012778 t) + 0.2989558 e^(-0.1932605 t)`, VDOT = round to 0.1); solve `VO2(v) = VDOT` by 20 Newton steps from v = 100 m/min; easy min/km = `1000 / (v * 0.651)`; display range `easy - 5 s` to `easy + 25 s`.
- Power mode zones as % of `0.98 * CP`: easy 60-78, 30K 89-92, Half Marathon 92-95, 15K 95-98, 10K and 8K 100-102, 5K 103-106 (rounded watts).

## Distance mode differences (`generateWeeklyDistancePlan`, minified `ma` in powerZones)

Same skeleton, with these changes: range 50 to 130 km (`Weekly distance must be between 50km and 130km`); budget `Math.round(km * pct / 100)`, minimum 8 (`Sub-threshold distance cannot be less than 8km. Please increase weekly distance or percentage.`); per-session cap 6 km if weekly km < 80 else none; sessions `budget < 18 ? 2 : 3`; tolerance 2.5 points; library short 6..12 x 1 km (15K), medium 3..6 x 2 km (HM), long 2 or 3 x 3 km (30K), customs Bakken 200 m and "400m @ 10K"; SubT day distance = work km + warm-up km + cool-down km (no recovery distance), description `${wu}km warmup, ${reps}×${distance}km @${pace}, ${cd}km cooldown`; long run `min(max(round(km * 0.25), 10), 35)`; failing spacing `continue`s but a missing long day is not checked; easy days are easy-preferred then remaining days in weekday order (no shuffle); easy split `floor(Z / n)` with the remainder handed out +1 to the first days (with half-km warm-ups the fractional remainder still adds a full 1 km to the first day); merge threshold 5 km and the loop runs only while `short.length > 1 && longer.length > 0`, merging the smallest short day into the smallest longer day; exhaustion error `Unable to generate a valid weekly distance plan after maximum attempts`. Display converts km to miles by `* 0.62137119`, `toFixed(1)`.

## Rounding summary

- SubT budget: `Math.round(minutes * pct / 100)` (JS half-up).
- 3-session targets: `Math.round(R * 0.5)`.
- Long run: `Math.round(minutes * 0.25)`, then clamp 75..135.
- Easy minutes: `Math.round(remaining / easyDays)`; output total may be off from the input by up to about half a minute per easy day.
- Recovery: integer 1 min per rep gap. SubT day durations are integers for all auto-selected sessions.
- Displayed SubT %: one decimal.

## Worked examples

Produced by running the unmodified production `weeklyTraining-BAoSQQik.js` in Node with `Math.random` replaced by a seeded mulberry32 (seed shown); planner called exactly as the Plan Generator does: `g(minutes, 23, ["monday"], prefs, wu, cd)`. Durations in minutes. Because of randomness the interval choices and day pairing differ between runs; the structure does not.

A. 360 min (6 h), all Default, WU/CD 10/10, seed 1. Budget 83, cap 35, 3 sessions. Long pick 3x10 (30), remainder 53, targets 27: short 9x3 (27), medium 4x7 (28). Work 85 (23.6%), recoveries 2+8+3 = 13, WU/CD 60, SubT-day total 158. Long 90 on Sunday. Easy days Mon/Wed/Fri: round((360 - 158 - 90) / 3) = 37.

| Day | Type | Min | Description |
|---|---|---|---|
| Mon | easy | 37 | 37min easy run |
| Tue | subT | 51 | 10m warmup, 4×7min @Half Marathon, 10m cooldown |
| Wed | easy | 37 | 37min easy run |
| Thu | subT | 55 | 10m warmup, 9×3min @15K, 10m cooldown |
| Fri | easy | 37 | 37min easy run |
| Sat | subT | 52 | 10m warmup, 3×10min @30K, 10m cooldown |
| Sun | long | 90 | 90min long run |

Page totals: 359 min (rounding), SubT 85 min, 23.7%.

B. 240 min (4 h), all Default, seed 2. Budget 55, cap 25, 2 sessions on Tue/Thu. Long 2x12 (24); remainder 31, closest capped short/medium is 8x3 (24). Work 48 is 20.0%, never within 1.5 points at this volume, so attempt 30 is used. SubT-day total 48 + 8 + 40 = 96. Long 75 Sunday. Four easy days at round(69 / 4) = 17 <= 25, so the merge rule pairs them: two become rest, two become 34.

| Day | Type | Min | Description |
|---|---|---|---|
| Mon | rest | 0 | Rest Day |
| Tue | subT | 45 | 10m warmup, 2×12min @30K, 10m cooldown |
| Wed | easy | 34 | 34min easy run |
| Thu | subT | 51 | 10m warmup, 8×3min @15K, 10m cooldown |
| Fri | easy | 34 | 34min easy run |
| Sat | rest | 0 | Rest Day |
| Sun | long | 75 | 75min long run |

Page totals: 239 min, SubT 48 min, 20.1%.

C. 480 min (8 h), Mon Rest, Tue SubT, Sat Long, seed 3. Budget 110, uncapped, 3 sessions. Tue is fixed; 2 more chosen from default days {Wed, Thu, Fri, Sun} by random well-spaced combination with Tue (here Fri and Sun). Long 120 on Saturday (preference). Work 40 + 40 + 33 = 113 (23.5%); SubT-day total 113 + 15 + 60 = 188; easy Wed/Thu = (480 - 188 - 120) / 2 = 86.

| Day | Type | Min | Description |
|---|---|---|---|
| Mon | rest | 0 | Rest Day |
| Tue | subT | 69 | 10m warmup, 10×4min @15K, 10m cooldown |
| Wed | easy | 86 | 86min easy run |
| Thu | easy | 86 | 86min easy run |
| Fri | subT | 64 | 10m warmup, 5×8min @Half Marathon, 10m cooldown |
| Sat | long | 120 | 120min long run |
| Sun | subT | 55 | 10m warmup, 3×11min @30K, 10m cooldown |

D. 600 min (10 h), Mon Rest, Fri Rest, Sun Easy, WU 15 / CD 10, seed 4. SubT on Tue/Thu/Sat (Tue/Thu/Sat rule). Long 135 lands on Sunday despite the Easy preference (Sunday is still "available" for the long run). Only Wednesday remains easy: 600 - 225 - 135 = 240.

| Day | Type | Min | Description |
|---|---|---|---|
| Mon | rest | 0 | Rest Day |
| Tue | subT | 84 | 15m warmup, 12×4min @15K, 10m cooldown |
| Wed | easy | 240 | 240min easy run |
| Thu | subT | 78 | 15m warmup, 6×8min @Half Marathon, 10m cooldown |
| Fri | rest | 0 | Rest Day |
| Sat | subT | 63 | 15m warmup, 3×12min @30K, 10m cooldown |
| Sun | long | 135 | 135min long run |

Work 132 = 22.0%.

E. Error cases. 420 min with SubT on Tuesday and Wednesday: `Invalid day preferences: Preferred SubT days cannot be on adjacent days.` (the page itself shows the violation without the prefix). 420 min with SubT on Sunday and Monday: passes preference validation, but every attempt fails the Sunday/Monday spacing check, producing 30 console warnings and `Could not generate a plan within 1.5% error rate after 30 attempts`.

Distribution check (3000 runs each, all Default): 240 to 258 min always 2 sessions, 0% within tolerance, 2 rest days from merging; 259 to 270 min 3 sessions, 1 merged rest day; 300+ min 0 rest days; SubT days always Tue/Thu(/Sat) and long always Sunday.

## Ambiguities and things not determined

- Randomness: the planner is non-deterministic (random long-interval pick, session-to-day shuffle, easy-day shuffle that decides which days merge into rest, random spacing searches, random fallbacks). Several shuffles use `sort(() => Math.random() - .5)`, whose distribution depends on the engine's sort algorithm, so the exact distribution is not reproducible outside V8. A deterministic re-implementation must pick a rule (for example, a fixed long interval choice) and that is a product decision, not something the source answers.
- The SubT share is hard-wired to 23% in the UI; whether to expose it is open.
- Probable bugs that a faithful port would reproduce: Sunday Easy preference overridden by the long run; easy-preferred days are the first converted to rest by the merge rule; Sun+Mon SubT preferences pass validation then fail with a misleading "1.5% error rate" message; at 240 to 258 min the tolerance is never met and the 30th random draw is used; if fewer default days remain than sessions, fewer SubT days are placed than sessions while `subTDuration` still counts all sessions (the extra session is silently dropped); a third SubT preference beyond the session count is treated as an ordinary available day (it can become the long run or easy); merging can push total rest days above the stated max of 2; the "2-3 SubT days" minimum is never enforced; warm-up/cool-down outside 5 to 20 typed directly are accepted.
- The Dashboard's own duration check allows 601 min ("10 hours 1 minute (601 minutes)") but the planner rejects 601; Dashboard always generates with 10/10 warm-up/cool-down and rewrites descriptions from a separate workout configuration that was not traced in detail.
- The 1-minute recovery is a fixed constant in planning, while the per-day recalculation after an interval swap uses `recoverySeconds ?? 60`; identical for auto-selected sessions.
- Behaviour of the logged-in Dashboard beyond the planner call (Firestore-saved preferences, scheduling, Garmin/intervals.icu push) was not analysed.

## Appendix: verbatim minified source

From `weeklyTraining-BAoSQQik.js` unless stated. Interval tables are abbreviated to their first entries (full list reproduced above).

Interval library and helpers:

```js
const G=[{type:"short",reps:7,duration:3,totalDuration:21,paceTarget:"15K"},{type:"short",reps:8,duration:3,totalDuration:24,paceTarget:"15K"}, /* ... */],J=[{type:"medium",reps:3,duration:6,totalDuration:18,paceTarget:"Half Marathon"}, /* ... */],Q=[{type:"long",reps:2,duration:10,totalDuration:20,paceTarget:"30K"}, /* ... */],X=[{type:"custom",name:"Bakkens' 45/15",reps:15,duration:.75,totalDuration:15, /* ... */ excludeFromAutoSelection:!0}, /* ... */],tt=[...G,...J,...Q,...X];
function et(){return tt.filter(t=>!t.excludeFromAutoSelection)}
function K(t){return`${t.type}-${t.reps}-${t.duration}`}
```

Validation:

```js
const nt=1,A={maxRestDays:2,maxEasyDays:2,maxLongDays:1,maxSubTDays:3};function rt(t){const a=[],r={rest:0,easy:0,long:0,subT:0,default:0};Object.values(t).forEach(n=>{n&&n!=="default"&&r[n]++}),r.rest>A.maxRestDays&&a.push(`Maximum ${A.maxRestDays} rest days allowed (you have ${r.rest})`),r.easy>A.maxEasyDays&&a.push(`Maximum ${A.maxEasyDays} easy days allowed (you have ${r.easy})`),r.long>A.maxLongDays&&a.push(`Maximum ${A.maxLongDays} long day allowed (you have ${r.long})`),r.subT>A.maxSubTDays&&a.push(`Maximum ${A.maxSubTDays} SubT days allowed (you have ${r.subT})`);const l=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"].map((n,s)=>t[n]==="subT"?s:-1).filter(n=>n!==-1);for(let n=0;n<l.length-1;n++)if(l[n+1]-l[n]===1){a.push("Preferred SubT days cannot be on adjacent days.");break}return{isValid:a.length===0,violations:a}}function ot(t){const a={};return t.forEach(r=>{const i=r;a[i]="rest"}),a}
```

Spacing helpers:

```js
const j=t=>{if(t.length<=1)return!0;const a=["monday","tuesday","wednesday","thursday","friday","saturday","sunday"],r=t.map(n=>a.indexOf(n)).sort((n,s)=>n-s);for(let n=0;n<r.length-1;n++)if(r[n+1]-r[n]===1)return!1;const i=t.includes("sunday"),l=t.includes("monday");return!(i&&l)},st=(t,a)=>{if(a===0)return[];if(a===1)return[t[0]];const i=["tuesday","thursday","saturday"].filter(s=>t.includes(s));if(i.length>=a){const s=i.slice(0,a);if(j(s))return s}const l=50;let n=0;for(;n<l;){n++;const h=[...t].sort(()=>Math.random()-.5).slice(0,a);if(j(h))return h}return U(t,a)};
const lt=(t,a,r)=>{if(a===0)return[];if(t.length<a)return U(t,a);const i=[/* weekdays */],l=it(t,a);l.sort(()=>Math.random()-.5);for(const n of l){const s=[...n,...r];if(s.sort((h,g)=>i.indexOf(h)-i.indexOf(g)),j(s))return n}return console.warn(/* ... */),U(t,a)},U=(t,a)=>{if(a===0)return[];if(a===1)return[t[0]];const r=[/* weekdays */],i=t.map(h=>r.indexOf(h));i.sort((h,g)=>h-g);const l=[];let n=0;if(l.push(i[n]),a>1){const h=Math.floor(i.length/a);for(let g=1;g<a;g++){const M=Math.min(n+h,i.length-1);l.push(i[M]),n=M}}const s=Array.from(new Set(l));for(;s.length<a&&s.length<i.length;){const h=i.find(g=>!s.includes(g));if(h!==void 0)s.push(h);else break}return s.sort((h,g)=>h-g),s.map(h=>r[h])};
```

Session selection (`ut`), long run (`dt`), SubT day duration (`ct`):

```js
function ut(t,a=23){const r=Math.round(t*(a/100));if(r<48)throw new Error("Sub-threshold duration cannot be less than 48 minutes. Please increase weekly duration or percentage.");const i=t/60,l=i<=5?25:i<=7?35:1/0, /* ... */ M=g(n),v=g(s),H=g(h),N=r<60?2:3,C=H.length>0?H:h,R=C[Math.floor(Math.random()*C.length)],$=Math.max(0,r-R.totalDuration),S=[R],T=new Set([K(R)]);if(N===2){const u=$,b=[...M,...v].filter(d=>!T.has(K(d))), /* ... */ if(u>0&&x.length>0)y=x.reduce((d,L)=>{const I=Math.abs(L.totalDuration-u),V=Math.abs(d.totalDuration-u);return I<V?L:d}); /* ... */ S.push(y)}else{const u=Math.round($*.5),b=Math.round($*.5),x=(o,m,p)=>{const D=m.filter(w=>!p.has(K(w)));return D.length===0?null:o<=0?D[Math.floor(Math.random()*D.length)]:D.reduce((w,E)=>{const _=Math.abs(E.totalDuration-o),O=Math.abs(w.totalDuration-o);return _<O?E:w})};let y=null,d=null;M.length>0&&(y=x(u,M,T),y&&T.add(K(y))),v.length>0&&(d=x(b,v,T),d&&T.add(K(d))); /* fallbacks ... */ }for(let u=S.length-1;u>0;u--){const b=Math.floor(Math.random()*(u+1));[S[u],S[b]]=[S[b],S[u]]}return S}
function dt(t){const r=Math.round(t*.25);return Math.min(Math.max(r,75),135)}
function ct(t){if(at(t))return t.totalDuration;const a=t.recoverySeconds??60,r=t.totalDuration,i=(t.reps-1)*(a/60);return r+i}
```

Main planner (`ht`), lightly elided:

```js
function ht(t,a=23,r=["monday"],i,l=10,n=10){if(t<240||t>600)throw new Error("Weekly duration must be between 4 hours (240 minutes) and 10 hours (600 minutes)");let s={};if(i){const M=rt(i);if(!M.isValid)throw new Error(`Invalid day preferences: ${M.violations.join(", ")}`);s=i}else{if(r.length>2)throw new Error("Maximum 2 rest days allowed");s=ot(r)}const h=30;let g=0;for(;g<h;){g++;const M=ut(t,a),v=M.reduce((R,$)=>R+$.totalDuration,0),H=v/t*100;if(Math.abs(H-a)<=1.5||g===h){ /* ... */ const $=M.reduce((e,c)=>e+(c.reps-1)*nt,0),S=l+n,T=v+$+S*M.length, /* ... */ x=u.filter(e=>s[e]==="rest"),y=u.filter(e=>s[e]==="easy"),d=u.filter(e=>s[e]==="long"),L=u.filter(e=>s[e]==="subT"),I=u.filter(e=>!s[e]||s[e]==="default"),V=M.length,o={totalDuration:t,subTDuration:v,subTPercentage:H};let m=[],p=[],D;m=[...x],p=[...L.slice(0,V)];const w=V-p.length;if(w>0){const e=I.filter(f=>!m.includes(f)&&!p.includes(f));let c=[];p.length>0?c=lt(e,w,p):c=st(e,w),p.push(...c)}if(p.sort((e,c)=>b.indexOf(e)-b.indexOf(c)),!j(p))continue;const E=u.filter(e=>!m.includes(e)&&!p.includes(e));if(d.length>0&&E.includes(d[0])?D=d[0]:E.includes("sunday")?D="sunday":E.includes("saturday")?D="saturday":E.length>0&&(D=[...E].sort(()=>Math.random()-.5)[0]),!D)continue;const _=dt(t),O=[];y.forEach(e=>{!m.includes(e)&&e!==D&&!p.includes(e)&&O.push(e)});let F=u.filter(e=>!m.includes(e)&&e!==D&&!p.includes(e)&&!O.includes(e));for(let e=F.length-1;e>0;e--){const c=Math.floor(Math.random()*(e+1));[F[e],F[c]]=[F[c],F[e]]}O.push(...F);const z=O.length,Z=t-T-_,Y=z>0?Math.round(Z/z):0;p.forEach((e,c)=>{const f=M[c];o[e]={type:"subT",duration:ct(f)+S,description:`${l}m warmup, ${f.reps}×${f.duration}min @${f.paceTarget}, ${n}m cooldown`,subTWorkout:f}}),O.forEach(e=>{o[e]={type:"easy",duration:Y,description:`${Y}min easy run`}}),o[D]={type:"long",duration:_,description:`${_}min long run`},m.forEach(e=>{o[e]={type:"rest",duration:0,description:"Rest Day"}});const q=25, /* ... */ let k=R(o);for(;k.short.length>1;){const e=k.short.shift();if(!e)break;let c;const f=k.short.length>0?k.short[0]:null,P=k.longer.length>0?k.longer[0]:null;if(f&&P?f.duration<=P.duration?c=f.day:c=P.day:f?c=f.day:P&&(c=P.day),c)o[c].duration+=e.duration,o[c].description=`${o[c].duration}min easy run`,o[e.day].type="rest",o[e.day].duration=0,o[e.day].description="Rest Day",o[e.day].subTWorkout&&delete o[e.day].subTWorkout,k=R(o);else break}return o}}throw new Error(`Could not generate a plan within 1.5% error rate after ${h} attempts`)}
```

Easy-day grouping used by the merge (`R` inside `ht`):

```js
let R=function(e){const c=[];for(const f of W)e[f]&&typeof e[f]=="object"&&e[f].type==="easy"&&c.push({day:f,duration:e[f].duration});return c.sort((f,P)=>f.duration-P.duration),{short:c.filter(f=>f.duration<=q),longer:c.filter(f=>f.duration>q)}};
```

Plan Generator call site and SubT % recompute (`PlanGenerator-DYzr_jIM.js`, prettified):

```js
const Ta = { mode: "duration", distance: 5e3, selectedDistance: "5K", hours: "00", minutes: "", seconds: "", weeklyHours: "", weeklyMinutes: "", weeklyDistance: "", useImperialUnits: !1, subTPercentage: 23, weeklyDayPreferences: {}, defaultCooldownEnabled: !0 };
// [Y, es] = u.useState(10), [Z, ss] = u.useState(10), [O, ts] = u.useState(2), [_, as] = u.useState(2)
c = sa(f, s.subTPercentage, ["monday"], s.weeklyDayPreferences, p, j);
// ...
ue.forEach((f) => { const U = c[f.key]; U && U.type !== "rest" && (D += U.duration || 0); }), (P.subTPercentage = (c.subTDuration / D) * 100);
```

Day preference select handler (Default deletes the key):

```js
st = (t, a) => { const o = { ...s.weeklyDayPreferences }; (a === "default" ? delete o[t] : (o[t] = a), C({ weeklyDayPreferences: o })); }
```

Dashboard call site (`Dashboard-DOin6bK5.js`):

```js
[q,Y]=u.useState(23) /* ... */ const nn=Gt*60+zn;if(nn<240||nn>601)throw new Error("Weekly duration must be between 4 hours (240 minutes) and 10 hours 1 minute (601 minutes)");const w=Cu(nn,q,st,F,10,10)
```

Duration formatter (`index-D83xkg7O.js`):

```js
function od(t){const e=Math.floor(t/60),r=t%60;return e===0?`${r}m (${t} minutes)`:r===0?`${e}h (${t} minutes)`:`${e}h ${r}m (${t} minutes)`}
```

Distance-mode differences (`powerZones-DeFf7-aM.js`, prettified):

```js
const n = e < 80 ? 6 : 1 / 0, /* ... */ I = t < 18 ? 2 : 3,
function Hn(e) { const t = Math.round(e * 0.25); return Math.min(Math.max(t, 10), 35); }
if (Math.abs(I - o) <= 2.5 || d === l) {
let de = Math.floor(Z / F), ae = Z - de * F; for (let u = 0; u < F; u++) { let v = de; (ae > 0 && ((v += 1), (ae -= 1)), re.push(v)); }
const ue = 5, /* ... */ for (; Y.short.length > 1 && Y.longer.length > 0;) { const u = Y.short[0], v = Y.longer[0]; /* merge u into v, u becomes rest */ }
const Zt = 0.62137119, Sa = 1 / Zt
```
