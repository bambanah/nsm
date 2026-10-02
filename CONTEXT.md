# NSM Planner

Plans a Norwegian Singles Method running week from a weekly time budget, following the threshold.works planning model, and syncs it to intervals.icu.

## Planning

**Plan Settings**:
The persisted inputs from which every Week is derived: Weekly Duration, warm-up and cool-down length, a Day Preference per weekday, and a Shuffle. The only planning state the app stores.
_Avoid_: Template, config, profile

**Weekly Duration**:
The total running time budget for a Week, between 4 and 10 hours.
_Avoid_: Weekly hours, volume

**Day Preference**:
A weekday's requested role: Default, Rest, Easy, Long or SubT. Default leaves the choice to the planner.
_Avoid_: Day type, day setting

**Shuffle**:
The value in the Plan Settings that, with a Week's Monday date, fixes every choice the planning model leaves to chance. Set at random when Plan Settings are created; reshuffling changes every Week.
_Avoid_: Seed, randomise

**Week**:
A Monday-to-Sunday set of runs derived from the Plan Settings and its Monday date, so consecutive Weeks differ. Never stored or hand-edited in the app.
_Avoid_: Plan, schedule

## Runs

**Sub-threshold Session**:
One of the two or three interval days in a Week: warm-up, a Rep Format at its Rep Length's pace with one-minute recoveries, cool-down.
_Avoid_: SubT workout, quality session, workout

**Rep Format**:
A Sub-threshold Session's reps and rep minutes, e.g. 4×7.
_Avoid_: Interval, set

**Rep Length**:
A Rep Format's tier, named by its target race pace: 15K (short reps), HM (medium reps) or 30K (long reps).
_Avoid_: Short, medium, long

**Long Run**:
The single longest easy run of the Week, a quarter of the Weekly Duration within fixed bounds.
_Avoid_: Long session

**Easy Run**:
A run at easy pace filling the Week's remaining time.

**Rest Day**:
A day with no run, either requested or produced when short Easy Runs are merged.

## Sync

**Sync**:
Pushing a Week to the intervals.icu calendar, replacing that Week's Managed Workouts and leaving everything else untouched.
_Avoid_: Export, upload, publish

**Managed Workout**:
A planned workout on the intervals.icu calendar that was created by a Sync and is identified as the app's own. Manual edits to it are overwritten by the next Sync.
_Avoid_: Event, app workout
