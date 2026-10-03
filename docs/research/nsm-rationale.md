# Norwegian Singles Method: rationale behind the planner rules

What the primary sources say about each rule in `src/planner/planner.ts` and `src/planner/rep-formats.ts`, and why. Researched 2026-10-03.

## Sources and how far to trust them

- norwegiansingles.run, the community guide (all nine pages read in full via their `.llms.md` versions). It summarises James Copeland's ("sirpoc84") 2025 book in its own words and is the most current statement of the method. Cited below as "guide".
- The original LetsRun thread "Modifying the Norwegian approach to lower mileage" (https://www.letsrun.com/forum/flat_read.php?thread=12130781). LetsRun sits behind a Cloudflare challenge that returns 403 to non-browser fetches, so sirpoc84's posts were read from the community archive at https://sites.google.com/view/sub-threshold/sirpoc84-posts, which reproduces them verbatim with a link to each LetsRun post. Quotes below cite the LetsRun post URL given by the archive; they were not re-checked against LetsRun itself.
- Secondary sources linked from the guide: the archive's "The Method" summary (11/01/2023, author not named), the "Norwegian single approach" executive summary Google Doc, and the Lactrace pace calculator. These are community write-ups, not Copeland's words, and are flagged where used.
- Copeland's book (Norwegian Singles Method: Subthreshold Running Kept Simple, 2025) was not accessed; it is paid. Where the guide paraphrases it, that is noted.
- The app's constants (23%, ±1.5 points, 2-vs-3 at 60 min, 75-135 min long run, 25 min merge) match the threshold.works Plan Generator documented in `docs/research/threshold-works-model.md`. They come from that calculator, not from Copeland or the guide.

## The core rationale (applies to every rule)

- Maximise sustainable training load (CTL/TSS) per hour, not any particular physiological system. sirpoc: "I have about 7 hours a week to train. So running as much sub threshold as I can, which gives a very good CTL score compared to say running 6 days, with long run, hills and a workout, means I'm creating more CTL for the same amount of time" (https://www.letsrun.com/forum/flat_read.php?thread=12130781#post-14).
- Sub-threshold has the best load-to-recovery ratio, so three can fit in a week. sirpoc's worked example: a session just above threshold scores more TSS but "I would probably need two easy days after that, whereas the second session in the example, I only need a day's recovery. So I can run three of those in a week for 228 worth of TSS, whereas the harder session realistically I'm capped at 2 a week" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=4#post-96).
- Going over threshold costs disproportionate fatigue. "The amount of fatigue is totally out of proportion to what seems like only a little bit of extra pace" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=30#post-603).
- Nothing special about sub-threshold itself: "it's probably the easiest range to control, as well as the easiest to access or qualify in some way, along with seemingly fitting the various 'load' models the best" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=174#post-3482).
- The guide's restatement: "The core idea is maximizing repeatable training load while managing fatigue" (https://norwegiansingles.run/), and "Improvement comes from months of training you can absorb" (https://norwegiansingles.run/section1_core_principles.html).
- Target audience by weekly time. Guide: "particularly those training 5-9 hours per week" (https://norwegiansingles.run/). sirpoc: "about 5-8.5 hours max here as the sweetspot ... Anything much less than 5 hours, realistically you are losing the benefit as it just doesn't give you enough hours for 3 sessions" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=81#post-1636).

## Per-rule findings

### Sub-threshold Work = rep minutes only, 23% of weekly time (±1.5 points)

- Rep minutes only: agrees. Guide: "Count only the repetitions as quality minutes. Include warm-ups, recoveries and cool-downs when budgeting the full session and weekly time" (https://norwegiansingles.run/section2_implementing_the_method.html).
- Share: sources give a range, not 23%. Guide: "Around 20-25% of weekly training time is a useful starting range for sub-threshold work once established" (same page). Archive summary: "20-25% (MAYBE 30%) of total time spent running" (https://sites.google.com/view/sub-threshold/home). sirpoc's own split: "the last 6 weeks average out to 74/26" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=4#post-94), and "I do about 105 minutes a week out of my 7 hours" (25%; archived at https://sites.google.com/view/sub-threshold/other-helpful-comments).
- Why ~20-25%: borrowed from Seiler's 80/20 applied as time in zone, nudged up because singles runners cannot pile on easy volume: "for hobby joggers and cyclists, time in zone he would accept. Mainly because we aren't running doubles, so it's not realistic to have as much easy" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=4#post-94). Progression keeps the ratio by lengthening easy runs alongside extra reps (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=6#post-130).
- 23% and ±1.5 points: not in any primary source; it is the threshold.works default, a point inside the 20-25% range.
- Disagreement 1, volume: the guide says the share should fall as volume rises: "As volume rises, quality may settle nearer 20-22% of weekly time. Do not keep extending workouts just to preserve 25%" (https://norwegiansingles.run/section2_implementing_the_method.html). The app holds 23% at every duration.
- Disagreement 2, two sessions: "Do not force this proportion while adapting to two sessions" (same page). The app applies 23% to two-session weeks.

### 2 sessions if the 23% budget is under 60 min, else 3

- Sources tie two sessions to experience, not to a minute budget. Guide: "If new to structured intensity, begin with two quality sessions, making the third slot easy or rest. At lower volumes, an eventual third session can be shorter and gentler while you assess recovery" (https://norwegiansingles.run/section2_implementing_the_method.html). Exec summary doc (secondary): start "with 2 workouts a week instead of three" for runners new to intensity.
- Why three is the target: "The third session is the key to creating that extra bit of load, week in, week out" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=81#post-1636).
- Low volume: sirpoc thinks the method is not worth it under ~5 h, rather than recommending a two-session version: "Under 5 hours (apart from just starting out) I would probably just roll the dice and do something aggressive from a Daniel's book" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=174#post-3482). The guide is softer: at lower volumes the third session can be "shorter and gentler".
- Flag: the 60-minute cut-over (about 4h20/week at 23%) has no source. The guide's direction is the opposite of a volume switch: keep three slots at low volume and shrink the third.

### Per-session work cap: 25 min up to 5h, 35 min up to 7h, uncapped above

- Sources give no cap formula. The nearest figures:
- At 7 h sirpoc did "10x1, 6x1600 and 5x2 quite comfortably on short rest for about 35-36 mins total each session" and explains why reps beat continuous tempo: "I would struggle to probably do this 3x a week even in the 25-30 min range straight" (archived at https://sites.google.com/view/sub-threshold/other-helpful-comments). So 35 min at 7 h matches.
- Archive summary: "if you run 50mpw in 7 hours, you should run a total of 84-105 mins of sub-threshold per week, or or 28-35 minutes per session" (sic) (https://sites.google.com/view/sub-threshold/home). A later community post describes "beyond 30 min of sub-LT work per session" as going past "the initial recommendations" (https://sites.google.com/view/sub-threshold/modifications).
- Community summary (colder and wiser, page 278): "3 workouts of (up to) 10K volume of intervals" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=278#post-5568).
- Flag, uncapped above 7 h: the sources argue against stretching single sessions at higher volume. Guide: "Around eight hours on singles, consider easy doubles if more volume is appropriate" and "Around eight weekly hours or more, extending each single run can become harder to recover from" (https://norwegiansingles.run/section2_implementing_the_method.html, https://norwegiansingles.run/section6_benefits_monitoring.html). sirpoc: at 70+ mpw "I would do the doubles on the easy days", with "extra reps" added to the three sessions (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=2#post-42). The guide's 20-22% drift (above) would curb session growth too.
- The 25 min / 5 h tier has no source.

### One long-rep session plus short and/or medium sessions; rep formats

- Weekly template agrees. Guide example week: Tuesday "Longer sub-threshold repetitions", Thursday "Medium", Saturday "Shorter" (https://norwegiansingles.run/section2_implementing_the_method.html).
- Paces and lengths, guide (paraphrasing the book's original duration-based ranges): "About 3 minutes | 12-15k race pace | 60 seconds", "About 6 minutes | Around 20k / half-marathon pace | 60-90 seconds", "About 10 minutes | 25-30k race pace | 90-120 seconds" (same page).
- Archive summary (secondary) matches the app's lengths and counts closely: "3-4 minute reps with 60" rest at 10mi to 15K pace", "6-8 minute reps with 60" rest at HM pace", "10-12 minute reps with 60" rest at 30K pace"; by distance "8-12 x 1K", "4-6 x 2K", "3 x 3K" (https://sites.google.com/view/sub-threshold/home).
- sirpoc's original rotation was by distance: "10x1k is around 12-15k pace. 5x2k is around HM pace. 6x1600 right around 10 mile pace" plus 25x400 and 3x3k (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=1#post-30). He later dropped the 400s: "They didn't create anymore or less lactate and they trash my legs for the next day more" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=81#post-1636). The guide excludes them too: "Short, faster repetitions at 10k pace or above are not a default part of this framework".
- Why mix lengths: it is not about different adaptations. Every format aims at the same sub-threshold state, with pace set by rep length and rest: "25x400 would be a faster pace, than the other end of the scale , 5x2k. But ultimately you are reaching the same state of sub threshold, just under. Remember threshold is a state, not a pace" (https://www.letsrun.com/forum/flat_read.php?thread=12130781#post-14). Variety is for interest: "It keeps it simple and mixes up what the body is running at" (post-30), and "I don't have many sessions on rotation and it can get quite boring" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=3#post-77). Exec summary (secondary): "all sessions are almost equal in terms of stimulus ... it is better to do some variation for psychological reasons".
- Time-based reps: the guide wants reps to stay near the intended duration, not a fixed distance: "Keep short repetitions within roughly half a minute of the intended duration, and medium or long ones within about a minute" (https://norwegiansingles.run/section2_implementing_the_method.html). That supports the app's time-based formats.
- Small gaps: the guide's 3-minute row says "About 3 minutes", where the app also allows 4. No source names "2 x 10-12 min"; the summaries give 3 x 3K / 3 x 10-12 min. Neither is a real disagreement.

### 1-minute recoveries between all reps

- sirpoc's original practice agrees: "The key to this though, is all short rest. 60 seconds for everything but the 400s at 30" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=1#post-30). The archive summary also gives 60" for every format.
- Flag: the guide (following the book) lengthens recovery for longer reps: 60 s for ~3 min, 60-90 s for ~6 min, 90-120 s for ~10 min (https://norwegiansingles.run/section2_implementing_the_method.html). The exec summary doc (secondary) gives 3000m with 120 s and 2000m with 90 s. sirpoc moved to 2 min on 3200s, but for a road crossing: "literally no special reason" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=81#post-1636). So the app's fixed 1 minute matches the 2023 thread but is shorter than the guide/book for medium and long reps.
- Why short rest: it keeps lactate steady while letting you do more work than a continuous tempo. Archive summary: "goal is to just keep the rest short to maintain lactate state". Guide: "The breaks help limit accumulated fatigue and make pacing mistakes easier to correct. Shortening recovery or jogging faster is not a progression target." How you rest does not matter much: "Ultimately , just rest. I don't think it matters too much" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=2#post-42).

### Sub-threshold sessions never on adjacent days, Tue/Thu/Sat preferred

- Agrees, and this is central to the rationale. The guide's template puts Q on Tue/Thu/Sat with easy days between, and comparisons describe it as "E-Q-E-Q-E-Q-LR" (https://norwegiansingles.run/section7_comparative_analysis.html). Missed sessions: "resume the schedule without cramming it into the following easy day"; after setbacks keep "preserving space between demanding days" (https://norwegiansingles.run/section2_implementing_the_method.html, https://norwegiansingles.run/section4_individualization_considerations.html).
- Why: each session is sized so that one easy day is enough recovery. "It's hard, some days I could clearly do more. But have to remind myself, this has to be done again in 48 hours" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=5#post-109). "you want to be able to get every other day, but also want the most TSS" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=2#post-58).
- Tue/Thu/Sat comes from the guide's example week and sirpoc's run-every-day routine ("I literally do the same thing every week", post-130). Neither source says the specific weekdays matter. The guide calls them "session slots".

### Long run: 25% of weekly duration, clamped to 75-135 min, Sunday preferred

- Sunday: agrees ("Sunday | Longer easy run" in the guide's week).
- Easy: agrees. Guide: "Keep this an extension of easy running" and "Keep the long run easy rather than adding another demanding session" (https://norwegiansingles.run/section4_individualization_considerations.html, https://norwegiansingles.run/section2_implementing_the_method.html). sirpoc runs it at easy pace too, drifting up to the 70% HRmax ceiling by the end (post-30).
- Flag, sizing: the sources scale the long run to the ordinary easy run, not to weekly time, and make it shorter than the app does. Guide: "Copeland suggests approximately 1.7 times the duration of an ordinary easy run as a starting point: a 45-minute easy run implies roughly 75-80 minutes on Sunday. Higher-volume examples reach about 95-105 minutes" (section4). sirpoc at ~7 h: "3 sub threshold sessions (all last about 65 mins with a warm up and down) 3 easy runs of 50 mins and a long run of 75 mins" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=6#post-130). That long run is about 18% of a 420-minute week, where the app's 25% gives 105 min. Applying the 1.7x rule to sirpoc's week also gives about 80 min (19%). A community summary lists "Long runs over 80 minutes" among things the method leaves out (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=278#post-5568). sirpoc's long run did creep to about 1h40-1h50 later, at higher volume (https://sites.google.com/view/sub-threshold/modifications).
- The 135-minute cap goes past the guide's 95-105 minute higher-volume examples. Longer runs belong to the marathon adaptation only: "Copeland works toward expected race duration, capped at about three hours for slower runners" (https://norwegiansingles.run/section5_applicability_distances.html).
- Why keep it modest: the reason is the same as for everything else, recovery. A long run that is hard to absorb takes away from the three sessions. sirpoc, on marathon plans: "too much emphasis was put into the long run ... the best plan was to just run it super easy and replicate time on feet to goal time but not sacrifice the 3 workouts a week" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=228#post-4562).

### Everything else easy

- Agrees. Guide: "three quality sessions, three easy runs and one longer easy run" (https://norwegiansingles.run/section2_implementing_the_method.html). Strides, hills and strength are optional extras that "Copeland does not routinely include" (section4). sirpoc: "No strides. Nothing" (post-130).
- Why: easy days exist so the next quality day can happen. Guide: "Easy runs should leave room to recover between quality days" (https://norwegiansingles.run/section1_core_principles.html). On running easy days too fast: "it starts to fall down ... over time it adds up and you do that every other run and it's no longer sustainable" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=1#post-34).

### Easy runs of 25 min or less merged into rest days

- No source mentions a minimum easy-run length or merging short runs. This rule comes from threshold.works.
- What the sources say about rest days: guide "Preserve existing rest days when starting. For a six-day version, one ordinary easy day can become rest" (https://norwegiansingles.run/section2_implementing_the_method.html). sirpoc runs every day but calls rest days "highly individual. Listen to your body" (archived at https://sites.google.com/view/sub-threshold/other-helpful-comments). A community suggestion for six-day weeks: "Replace a recovery jog day with day off ... tack on 15-20 min to your cool down on those workout days and your long run day" (https://sites.google.com/view/sub-threshold/modifications).
- Rest days are endorsed; the 25-minute threshold has no source.

## Pacing guidance (norwegiansingles.run)

- Use current fitness: "Set targets from current race fitness, not a past personal best or goal time. The appropriate pace depends on repetition duration and recovery. Adjust for heat, humidity, wind and terrain before starting" (https://norwegiansingles.run/section1_core_principles.html). "Use equivalent race paces from current fitness and start at the slower end. The book also provides a newer 5k-based pace table for different abilities" (section2).
- Tools: the Lactrace calculator (https://lactrace.com/norwegian-singles) takes VDOT from a race, critical speed or critical power. The guide calls such outputs "starting estimates" to check "against repetition duration, heart rate and perceived effort" (section4).
- Reassess: "Reassess using races or time trials, often every 4-8 weeks. Update targets when performance supports it" (section2). A 5k race "replaces one quality session ... it should not become a fourth hard day" (section4).
- Heart rate: estimate LTHR as "the average HR during the final 20 minutes of a well-paced, solo 30-minute maximum effort after warming up". "Copeland describes early repetitions finishing about 10-15 beats below LTHR, with later ones approaching it from below. This is a useful pattern, not a target to chase ... repeatedly exceeding LTHR suggests the pace needs reducing" (section1). sirpoc uses 98% of that test value as LTHR to stay safe (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=11#post-221) and works at roughly "90-91% of LTHR up to 98% LTHR" (post-94). HR does not work for short reps: "you just wouldn't be able to control anything under 1km by heart rate" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=7#post-149).
- Lactate: the guide is deliberately non-numeric: "a fixed reading of 2, 3 or 4 mmol/L does not guarantee the right intensity. Interpret readings against your individual curve and their trend through the session" (section1). sirpoc's own readings were "around 2.5-3.5 mmol" (post-30). The archive summary says ~2.5-3.5 mmol at the end of the last rep for trained runners whose LT2 is 4.0-4.5. Erring low costs little: "Even if you lactate is only 2.0 mmol or just above ... you are still going to be getting a huge amount and % of the benefit" (post-603).
- Perceived effort: "Breathing should be controlled and the work manageable, with enough left for another repetition. Finish the planned session rather than testing that reserve" (section1). sirpoc rates sessions 4-6/10: "I would never say it feels easy. But it doesn't ever feel hard" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=122#post-2441).
- Bad days: "On a tired day, try the slower pace intended for longer repetitions, reduce the repetition count, or replace the session with easy running or rest" (section4).
- Power: the guide treats running power as a secondary reference only; sirpoc later called it "the absolute worst metric I had" (https://www.letsrun.com/forum/flat_read.php?thread=12130781&page=205#post-4109).

## Easy running and the long run (norwegiansingles.run)

- Easy intensity: "Copeland uses an average of no more than about 70% of measured maximum HR as a conservative cap, often running below it. This is a ceiling, not a goal. He now prefers HR to his earlier 65%-of-maximal-aerobic-speed guideline, which can still lead runners to push too hard" (section1). Look for "fairly steady HR after warming up. Slow down or walk hills as needed".
- Easy and long runs share a pace: "All are the same pace roughly. 65% of MAS" (post-130).
- Long run: "approximately 1.7 times the duration of an ordinary easy run", 75-80 min off a 45-min easy run, up to ~95-105 min at higher volume. "Adjust to your established longest run and recovery, rather than immediately adopting a new duration." Before a half, "occasional modest extensions can help with time on your feet, but matching a slower runner's entire race duration is unnecessary" (section4).
- Progression adds easy time alongside quality: "adding one 3-minute repetition across the whole week could be paired with about 12 extra easy minutes, distributed across existing runs" (section2).

## Summary of disagreements and gaps

- Sources disagree with the app: (1) long run sizing: the sources use ~1.7x an easy run (about 18-19% of a 7 h week, 75-105 min), the app uses 25% of the week up to 135 min; (2) uncapped session work above 7 h: the sources prefer easy doubles and a share falling to 20-22%; (3) a fixed 1-minute recovery: the guide/book use 60-90 s for ~6 min reps and 90-120 s for ~10 min reps (the 2023 thread used 60 s throughout); (4) 23% applied to two-session weeks: the guide says not to force the proportion while on two sessions.
- No source for the specific numbers: 23% ±1.5 (the sources say 20-25%), the 60-minute two-vs-three switch, the 25-minute per-session cap at 5 h, and merging easy runs of 25 minutes or less. All come from threshold.works.
- Supported: counting rep minutes only, the one long / medium / short template with 15K / HM / 30K paces and time-based reps, non-adjacent quality days on Tue/Thu/Sat, the long run on Sunday and easy, everything else easy, and ~35 min per session at 7 h.

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
- docs/research/threshold-works-model.md (origin of the app's constants)
