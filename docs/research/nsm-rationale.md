# Norwegian Singles Method: sources behind the planner rules

Each rule in `src/planner/` with what the sources say about it, and whether the rule is sourced or a planner choice. Sources researched 2026-10-03.

## Sources and how far to trust them

- norwegiansingles.run, the community guide (all nine pages read in full via their `.llms.md` versions). It summarises James Copeland's ("sirpoc84") 2025 book in its own words and is the most current statement of the method. Cited below as "guide". It is the authority for the planner's rules (ADR 0002).
- The original LetsRun thread "Modifying the Norwegian approach to lower mileage" (https://www.letsrun.com/forum/flat_read.php?thread=12130781). LetsRun sits behind a Cloudflare challenge that returns 403 to non-browser fetches, so sirpoc84's posts were read from the community archive at https://sites.google.com/view/sub-threshold/sirpoc84-posts, which reproduces them verbatim with a link to each LetsRun post. Quotes below cite the LetsRun post URL given by the archive; they were not re-checked against LetsRun itself.
- Secondary sources linked from the guide: the archive's "The Method" summary (11/01/2023, author not named), the "Norwegian single approach" executive summary Google Doc, and the Lactrace pace calculator. These are community write-ups, not Copeland's words, and are flagged where used.
- Copeland's book (Norwegian Singles Method: Subthreshold Running Kept Simple, 2025) was not accessed. Where the guide paraphrases it, that is noted.

A rule is **sourced** when the guide or sirpoc states it. A **planner choice** is a number or procedure the sources leave open; the planner picks one, and How this works labels it as such.

## The core rationale (applies to every rule)

- Maximise sustainable training load (CTL/TSS) per hour, not any particular physiological system. sirpoc: "I have about 7 hours a week to train. So running as much sub threshold as I can, which gives a very good CTL score compared to say running 6 days, with long run, hills and a workout, means I'm creating more CTL for the same amount of time" (https://www.letsrun.com/forum/flat_read.php?thread=12130781#post-14).
- Sub-threshold has the best load-to-recovery ratio, so three can fit in a week. sirpoc's worked example: a session just above threshold scores more TSS but "I would probably need two easy days after that, whereas the second session in the example, I only need a day's recovery. So I can run three of those in a week for 228 worth of TSS, whereas the harder session realistically I'm capped at 2 a week" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=4#post-96).
- Going over threshold costs disproportionate fatigue. "The amount of fatigue is totally out of proportion to what seems like only a little bit of extra pace" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=30#post-603).
- Nothing special about sub-threshold itself: "it's probably the easiest range to control, as well as the easiest to access or qualify in some way, along with seemingly fitting the various 'load' models the best" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=174#post-3482).
- The guide's restatement: "The core idea is maximizing repeatable training load while managing fatigue" (https://norwegiansingles.run/), and "Improvement comes from months of training you can absorb" (https://norwegiansingles.run/section1_core_principles.html).

## Rules

### Weekly Duration of 5-9 hours

- Sourced. Guide: "particularly those training 5-9 hours per week" (https://norwegiansingles.run/). sirpoc: "about 5-8.5 hours max here as the sweetspot ... Anything much less than 5 hours, realistically you are losing the benefit as it just doesn't give you enough hours for 3 sessions" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=81#post-1636).
- Below 5 hours sirpoc would rather not use the method: "Under 5 hours (apart from just starting out) I would probably just roll the dice and do something aggressive from a Daniel's book" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=174#post-3482).

### Sub-threshold Work counts rep minutes only

- Sourced. Guide: "Count only the repetitions as quality minutes. Include warm-ups, recoveries and cool-downs when budgeting the full session and weekly time" (https://norwegiansingles.run/section2_implementing_the_method.html).

### Sub-threshold Share: 23% up to 7h, easing to 20% at 9h, within ±1.5 points

- The range is sourced. Guide: "Around 20-25% of weekly training time is a useful starting range for sub-threshold work once established" (https://norwegiansingles.run/section2_implementing_the_method.html). Archive summary: "20-25% (MAYBE 30%) of total time spent running" (https://sites.google.com/view/sub-threshold/home). sirpoc's own split: "the last 6 weeks average out to 74/26" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=4#post-94), and "I do about 105 minutes a week out of my 7 hours" (25%; archived at https://sites.google.com/view/sub-threshold/other-helpful-comments).
- The easing is sourced. Guide: "As volume rises, quality may settle nearer 20-22% of weekly time. Do not keep extending workouts just to preserve 25%" (same page). Where it starts (7h) and ends (20% at 9h) is a planner choice.
- 23% and the ±1.5 tolerance are planner choices: a point inside the 20-25% range, and how close a Week must land to it.
- Why ~20-25%: Seiler's 80/20 applied as time in zone, nudged up because singles runners cannot pile on easy volume: "for hobby joggers and cyclists, time in zone he would accept. Mainly because we aren't running doubles, so it's not realistic to have as much easy" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=4#post-94). Progression keeps the ratio by lengthening easy runs alongside extra reps (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=6#post-130).

### Always three Sub-threshold Sessions

- Sourced. "The third session is the key to creating that extra bit of load, week in, week out" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=81#post-1636). Guide: "three quality sessions, three easy runs and one longer easy run" (https://norwegiansingles.run/section2_implementing_the_method.html).
- Two sessions are tied to experience, not volume. Guide: "If new to structured intensity, begin with two quality sessions, making the third slot easy or rest. At lower volumes, an eventual third session can be shorter and gentler while you assess recovery" and "Do not force this proportion while adapting to two sessions" (same page). Exec summary doc (secondary): start "with 2 workouts a week instead of three". The planner always plans three; How this works tells beginners to run one as an Easy Run.

### Per-session cap: 35 rep minutes up to 7h, none above

- 35 minutes at 7h matches sirpoc: "10x1, 6x1600 and 5x2 quite comfortably on short rest for about 35-36 mins total each session", and why reps beat continuous tempo: "I would struggle to probably do this 3x a week even in the 25-30 min range straight" (archived at https://sites.google.com/view/sub-threshold/other-helpful-comments). Archive summary: "if you run 50mpw in 7 hours, you should run a total of 84-105 mins of sub-threshold per week, or or 28-35 minutes per session" (sic) (https://sites.google.com/view/sub-threshold/home). A later community post describes "beyond 30 min of sub-LT work per session" as going past "the initial recommendations" (https://sites.google.com/view/sub-threshold/modifications). Community summary: "3 workouts of (up to) 10K volume of intervals" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=278#post-5568).
- Applying the cap below 7h and lifting it above is a planner choice. Above 7h the easing Sub-threshold Share limits session growth instead (9h gives about 108 rep minutes, 36 per session).
- At higher volume the sources add easy running, not longer sessions. Guide: "Around eight hours on singles, consider easy doubles if more volume is appropriate" and "Around eight weekly hours or more, extending each single run can become harder to recover from" (https://norwegiansingles.run/section2_implementing_the_method.html, https://norwegiansingles.run/section6_benefits_monitoring.html). sirpoc: at 70+ mpw "I would do the doubles on the easy days", with "extra reps" added to the three sessions (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=2#post-42). The planner plans one run per day; How this works says so.

### Rep Lengths and the race paces they are named after

- The three tiers are sourced. Guide (paraphrasing the book's duration-based ranges): "About 3 minutes | 12-15k race pace | 60 seconds", "About 6 minutes | Around 20k / half-marathon pace | 60-90 seconds", "About 10 minutes | 25-30k race pace | 90-120 seconds" (https://norwegiansingles.run/section2_implementing_the_method.html). The guide calls these short, medium and long repetitions.
- Naming each tier after the slowest pace in its band (15K, HM, 30K) is a planner choice. It fits the guide's "start at the slower end" (see Pacing guidance) and sirpoc's rotation: "10x1k is around 12-15k pace. 5x2k is around HM pace. 6x1600 right around 10 mile pace" plus 25x400 and 3x3k (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=1#post-30).
- Faster reps are excluded, as in the sources. sirpoc dropped the 400s: "They didn't create anymore or less lactate and they trash my legs for the next day more" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=81#post-1636). Guide: "Short, faster repetitions at 10k pace or above are not a default part of this framework".
- Time-based reps are sourced. Guide: "Keep short repetitions within roughly half a minute of the intended duration, and medium or long ones within about a minute" (same page).

### Rep Formats

- The list is a planner choice within the sourced rep durations: 15K reps of 3-4 minutes, 7-12 reps; HM reps of 6-8 minutes, 3-6 reps; 30K reps of 10-12 minutes, 2-3 reps.
- Archive summary (secondary): "3-4 minute reps with 60" rest at 10mi to 15K pace", "6-8 minute reps with 60" rest at HM pace", "10-12 minute reps with 60" rest at 30K pace"; by distance "8-12 x 1K", "4-6 x 2K", "3 x 3K" (https://sites.google.com/view/sub-threshold/home).
- Beyond the sources: 4-minute 15K reps (the guide says "About 3 minutes"; the archive allows 3-4), 7×3, 3×6 and the 2×10-12 formats. These give the planner small sessions to fill a Week near 5h.

### Recovery by Rep Length: 1 minute for 15K and HM reps, 2 minutes for 30K reps

- Sourced ranges, planner choice of value. The guide (following the book) gives 60 s for ~3 min reps, 60-90 s for ~6 min and 90-120 s for ~10 min (https://norwegiansingles.run/section2_implementing_the_method.html). The planner uses whole minutes: the low end for HM and the high end for 30K. The exec summary doc (secondary) gives 3000m with 120 s and 2000m with 90 s.
- sirpoc's 2023 practice was shorter: "The key to this though, is all short rest. 60 seconds for everything but the 400s at 30" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=1#post-30). He moved to 2 min on 3200s for a road crossing: "literally no special reason" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=81#post-1636).
- Why short rest: it keeps lactate steady while letting you do more work than a continuous tempo. Archive summary: "goal is to just keep the rest short to maintain lactate state". Guide: "The breaks help limit accumulated fatigue and make pacing mistakes easier to correct. Shortening recovery or jogging faster is not a progression target." How you rest does not matter much: "Ultimately , just rest. I don't think it matters too much" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=2#post-42).

### One session of each Rep Length, sized to the budget

- One of each matches the guide's example week (Tuesday "Longer sub-threshold repetitions", Thursday "Medium", Saturday "Shorter"; https://norwegiansingles.run/section2_implementing_the_method.html) but the sources do not require it. Every format aims at the same state: "25x400 would be a faster pace, than the other end of the scale , 5x2k. But ultimately you are reaching the same state of sub threshold, just under. Remember threshold is a state, not a pace" (https://www.letsrun.com/forum/flat_read.php?thread=12130781#post-14). Variety is for interest: "It keeps it simple and mixes up what the body is running at" (post-30), and "I don't have many sessions on rotation and it can get quite boring" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=3#post-77). Exec summary (secondary): "all sessions are almost equal in terms of stimulus ... it is better to do some variation for psychological reasons".
- How they are sized is a planner choice: a random 30K Rep Format, then the 15K and HM Rep Formats closest to half the remaining budget each, with the session-to-day order shuffled.

### Sub-threshold Sessions never on consecutive days

- Sourced, and central to the method. The guide's template puts sessions on Tue/Thu/Sat with easy days between, and comparisons describe it as "E-Q-E-Q-E-Q-LR" (https://norwegiansingles.run/section7_comparative_analysis.html). Missed sessions: "resume the schedule without cramming it into the following easy day"; after setbacks keep "preserving space between demanding days" (https://norwegiansingles.run/section2_implementing_the_method.html, https://norwegiansingles.run/section4_individualization_considerations.html).
- Why: each session is sized so that one easy day is enough recovery. "It's hard, some days I could clearly do more. But have to remind myself, this has to be done again in 48 hours" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=5#post-109). "you want to be able to get every other day, but also want the most TSS" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=2#post-58).
- Counting Sunday and Monday as consecutive follows from the same 48-hour reasoning.

### Tuesday, Thursday and Saturday by default

- Planner choice, following the guide's example week and sirpoc's run-every-day routine ("I literally do the same thing every week", post-130). Neither source says the specific weekdays matter; the guide calls them "session slots". When Day Preferences rule those days out, the planner tries other non-consecutive Default days.

### Long Run of 1.7 times an Easy Run, 75-105 minutes, on Sunday

- 1.7 times is sourced. Guide: "Copeland suggests approximately 1.7 times the duration of an ordinary easy run as a starting point: a 45-minute easy run implies roughly 75-80 minutes on Sunday. Higher-volume examples reach about 95-105 minutes" and "Adjust to your established longest run and recovery, rather than immediately adopting a new duration" (https://norwegiansingles.run/section4_individualization_considerations.html). sirpoc at ~7 h: "3 sub threshold sessions (all last about 65 mins with a warm up and down) 3 easy runs of 50 mins and a long run of 75 mins" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=6#post-130).
- The 75 and 105 minute bounds are a planner choice taken from the guide's examples. A community summary lists "Long runs over 80 minutes" among things the method leaves out (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=278#post-5568); sirpoc's long run did creep to about 1h40-1h50 later, at higher volume (https://sites.google.com/view/sub-threshold/modifications). Longer runs belong to the marathon adaptation only: "Copeland works toward expected race duration, capped at about three hours for slower runners" (https://norwegiansingles.run/section5_applicability_distances.html).
- Sunday is sourced ("Sunday | Longer easy run" in the guide's week). Falling back to Saturday, then any free day, is a planner choice.
- Easy is sourced. Guide: "Keep this an extension of easy running" and "Keep the long run easy rather than adding another demanding session" (section4, section2). sirpoc runs it at easy pace too, drifting up to the 70% HRmax ceiling by the end (post-30).
- Why keep it modest: recovery. A long run that is hard to absorb takes away from the three sessions. sirpoc, on marathon plans: "too much emphasis was put into the long run ... the best plan was to just run it super easy and replicate time on feet to goal time but not sacrifice the 3 workouts a week" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=228#post-4562).

### Everything else easy

- Sourced. Guide: "three quality sessions, three easy runs and one longer easy run" (https://norwegiansingles.run/section2_implementing_the_method.html). Strides, hills and strength are optional extras that "Copeland does not routinely include" (section4). sirpoc: "No strides. Nothing" (post-130).
- Why: easy days exist so the next quality day can happen. Guide: "Easy runs should leave room to recover between quality days" (https://norwegiansingles.run/section1_core_principles.html). On running easy days too fast: "it starts to fall down ... over time it adds up and you do that every other run and it's no longer sustainable" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=1#post-34).
- Splitting the remaining time evenly across Easy Runs is a planner choice; sirpoc's week uses equal easy runs ("3 easy runs of 50 mins", post-130).

### Easy Runs of 25 minutes or less merged into Rest Days

- Planner choice. No source mentions a minimum easy-run length or merging short runs.
- Rest days themselves are endorsed. Guide: "Preserve existing rest days when starting. For a six-day version, one ordinary easy day can become rest" (https://norwegiansingles.run/section2_implementing_the_method.html). sirpoc runs every day but calls rest days "highly individual. Listen to your body" (archived at https://sites.google.com/view/sub-threshold/other-helpful-comments). A community suggestion for six-day weeks: "Replace a recovery jog day with day off ... tack on 15-20 min to your cool down on those workout days and your long run day" (https://sites.google.com/view/sub-threshold/modifications).

### Warm-up and cool-down of 5-20 minutes each, 10 by default

- Planner choice. The guide says to include them "when budgeting the full session and weekly time" but gives no length. sirpoc's ~65-minute sessions at 7h (post-130) with about 35 rep minutes and short recoveries leave roughly 20-25 minutes for warm-up and cool-down together, consistent with the defaults.

### Day Preference limits: at most 2 Rest, 2 Easy, 1 Long and 3 SubT days

- 3 SubT days and 1 Long day follow from the sourced week shape: three sessions and one long run.
- 2 Rest and 2 Easy days are planner choices. The guide's six-day version has one rest day; the limits leave room for one more.

## Pacing guidance (norwegiansingles.run)

- Use current fitness: "Set targets from current race fitness, not a past personal best or goal time. The appropriate pace depends on repetition duration and recovery. Adjust for heat, humidity, wind and terrain before starting" (https://norwegiansingles.run/section1_core_principles.html). "Use equivalent race paces from current fitness and start at the slower end. The book also provides a newer 5k-based pace table for different abilities" (section2).
- Rep Paces: the planner finds the 15K, HM and 30K race paces equivalent to the 5K Time with Daniels-Gilbert VDOT, as the Lactrace calculator does (https://lactrace.com/norwegian-singles; it takes VDOT from a race, critical speed or critical power, and the guide links to it). The guide calls such outputs "starting estimates" to check "against repetition duration, heart rate and perceived effort" (section4). Each Rep Pace runs from that race pace to 3% slower, or 10 s/km slower at 5:00/km and slower: a planner choice matching Lactrace.
- Reassess: "Reassess using races or time trials, often every 4-8 weeks. Update targets when performance supports it" (section2). A 5k race "replaces one quality session ... it should not become a fourth hard day" (section4).
- Heart rate: estimate LTHR as "the average HR during the final 20 minutes of a well-paced, solo 30-minute maximum effort after warming up". "Copeland describes early repetitions finishing about 10-15 beats below LTHR, with later ones approaching it from below. This is a useful pattern, not a target to chase ... repeatedly exceeding LTHR suggests the pace needs reducing" (section1). sirpoc uses 98% of that test value as LTHR to stay safe (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=11#post-221) and works at roughly "90-91% of LTHR up to 98% LTHR" (post-94). HR does not work for short reps: "you just wouldn't be able to control anything under 1km by heart rate" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=7#post-149).
- Lactate: the guide is deliberately non-numeric: "a fixed reading of 2, 3 or 4 mmol/L does not guarantee the right intensity. Interpret readings against your individual curve and their trend through the session" (section1). sirpoc's own readings were "around 2.5-3.5 mmol" (post-30). The archive summary says ~2.5-3.5 mmol at the end of the last rep for trained runners whose LT2 is 4.0-4.5. Erring low costs little: "Even if you lactate is only 2.0 mmol or just above ... you are still going to be getting a huge amount and % of the benefit" (post-603).
- Perceived effort: "Breathing should be controlled and the work manageable, with enough left for another repetition. Finish the planned session rather than testing that reserve" (section1). sirpoc rates sessions 4-6/10: "I would never say it feels easy. But it doesn't ever feel hard" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=122#post-2441).
- Bad days: "On a tired day, try the slower pace intended for longer repetitions, reduce the repetition count, or replace the session with easy running or rest" (section4).
- Power: the guide treats running power as a secondary reference only; sirpoc later called it "the absolute worst metric I had" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=205#post-4109).

## Easy running (norwegiansingles.run)

- Easy intensity: "Copeland uses an average of no more than about 70% of measured maximum HR as a conservative cap, often running below it. This is a ceiling, not a goal. He now prefers HR to his earlier 65%-of-maximal-aerobic-speed guideline, which can still lead runners to push too hard" (section1). Look for "fairly steady HR after warming up. Slow down or walk hills as needed".
- Easy and long runs share a pace: "All are the same pace roughly. 65% of MAS" (post-130).
- Before a half, "occasional modest extensions can help with time on your feet, but matching a slower runner's entire race duration is unnecessary" (section4).
- Progression adds easy time alongside quality: "adding one 3-minute repetition across the whole week could be paired with about 12 extra easy minutes, distributed across existing runs" (section2).

## Planner choices

The numbers and procedures the sources leave open, each labelled *planner choice* on How this works:

- 23% Sub-threshold Share up to 7h, easing to 20% at 9h, accepted within ±1.5 points (sources: 20-25%, settling to 20-22% at higher volume).
- 35 rep minutes per session up to 7h, no cap above.
- Naming each Rep Length after the slowest pace in the guide's band, and the Rep Format list.
- Whole-minute Recoveries within the guide's ranges.
- A random 30K Rep Format, then 15K and HM Rep Formats closest to half the remainder; one of each per Week.
- Tuesday, Thursday and Saturday by default.
- Long Run bounds of 75-105 minutes and the Saturday fallback.
- An even split of Easy Runs, merging those of 25 minutes or less into Rest Days.
- Warm-up and cool-down of 5-20 minutes.
- At most 2 Rest and 2 Easy Day Preferences.
- The 3% / 10 s width of a Rep Pace.

## Sources

- https://norwegiansingles.run/ (Introduction, Background)
- https://norwegiansingles.run/section1_core_principles.html
- https://norwegiansingles.run/section2_implementing_the_method.html
- https://norwegiansingles.run/section3_training_load.html
- https://norwegiansingles.run/section4_individualization_considerations.html
- https://norwegiansingles.run/section5_applicability_distances.html
- https://norwegiansingles.run/section6_benefits_monitoring.html
- https://norwegiansingles.run/section7_comparative_analysis.html
- https://norwegiansingles.run/section8_ai_assistance.html
- https://www.letsrun.com/forum/flat_read.php?thread=12130781 (original thread; individual post URLs cited inline, read via the archive below)
- https://sites.google.com/view/sub-threshold/sirpoc84-posts (verbatim archive of sirpoc84's posts)
- https://sites.google.com/view/sub-threshold/home ("The Method" community summary, 11/01/2023)
- https://sites.google.com/view/sub-threshold/other-helpful-comments
- https://sites.google.com/view/sub-threshold/modifications
- https://docs.google.com/document/d/1OUk4lHlMzLkYzJAhlJAeaoj9OQNJH6g7uS31fl1To4Q/edit (executive summary "The Norwegian single approach", secondary)
- https://lactrace.com/norwegian-singles (pace calculator)
