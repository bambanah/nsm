import { createFileRoute, Link } from '@tanstack/react-router'
import type { HowItWorksSection } from '@/components/explained'
import { ThemeMenu } from '@/components/theme-menu'
import {
  LONG_RUN_RATIO,
  MAX_LONG_RUN_MINUTES,
  MAX_WEEKLY_DURATION_MINUTES,
  MIN_LONG_RUN_MINUTES,
  MIN_SUB_THRESHOLD_PERCENT,
  MIN_WEEKLY_DURATION_MINUTES,
  SESSION_CAP_UNTIL_MINUTES,
  SESSION_WORK_CAP_MINUTES,
  SHORT_EASY_RUN_MINUTES,
  SUB_THRESHOLD_PERCENT,
  SUB_THRESHOLD_SESSIONS,
  TAPER_FROM_MINUTES,
  TOLERANCE,
} from '@/planner/planner'
import { RACE_PACES, RECOVERY_MINUTES, REP_FORMATS, type RepLength } from '@/planner/rep-formats'
import { DAY_PREFERENCE_LIMITS } from '@/planner/validate'

export const Route = createFileRoute('/how-it-works')({
  head: () => ({ meta: [{ title: 'How this works - NSM Planner' }] }),
  component: HowItWorks,
})

const hours = (minutes: number) => `${minutes / 60}h`

const NSM_GUIDE = 'https://norwegiansingles.run/'

function HowItWorks() {
  return (
    <main className="mx-auto flex max-w-3xl flex-col gap-8 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <Link to="/" className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          NSM Planner <span className="text-primary">•</span>
        </Link>
        <ThemeMenu />
      </header>

      <div className="flex flex-col gap-3">
        <h1 className="text-3xl font-extrabold tracking-tight">How this works</h1>
        <p>
          The planner turns a Weekly Duration of {hours(MIN_WEEKLY_DURATION_MINUTES)} to{' '}
          {hours(MAX_WEEKLY_DURATION_MINUTES)} into a Week of Norwegian Singles Method training.
          This page sets out the rules it applies, in the order it applies them. For the method
          itself, read the <ExternalLink href={NSM_GUIDE}>Norwegian Singles guide</ExternalLink>.
        </p>
        <p>
          The rules started from the{' '}
          <ExternalLink href="https://threshold.works/plangenerator">
            threshold.works Plan Generator
          </ExternalLink>
          , adapted wherever the method's sources say otherwise. Rules marked{' '}
          <em>planner choice</em> are not in the sources.
        </p>
        <p>
          <Link to="/" className="font-semibold text-primary hover:underline">
            ← Back to the planner
          </Link>
        </p>
      </div>

      <Section id="budget" title="Sub-threshold budget">
        <p>
          <strong>Sub-threshold Work</strong> is the Week's rep minutes. Warm-ups, cool-downs and
          Recoveries count as easy time. <strong>Sub-threshold Share</strong> is Sub-threshold Work
          as a percentage of the Week's total running time.
        </p>
        <p>
          NSM suggests 20-25% of weekly time once established; the planner aims for{' '}
          {SUB_THRESHOLD_PERCENT}% up to {hours(TAPER_FROM_MINUTES)} (<em>planner choice</em>).
          Above that the target eases to {MIN_SUB_THRESHOLD_PERCENT}% at{' '}
          {hours(MAX_WEEKLY_DURATION_MINUTES)}, because the sources say quality settles nearer
          20-22% as weekly time rises, rather than Sub-threshold Sessions growing to hold the share:
        </p>
        <Formula>
          target = {SUB_THRESHOLD_PERCENT}% − {SUB_THRESHOLD_PERCENT - MIN_SUB_THRESHOLD_PERCENT} ×
          (Weekly Duration − {TAPER_FROM_MINUTES}) ÷{' '}
          {MAX_WEEKLY_DURATION_MINUTES - TAPER_FROM_MINUTES}
        </Formula>
        <p>
          A Week is accepted within ±{TOLERANCE} points of the target (<em>planner choice</em>). If
          no draw of sessions gets that close, the planner uses the closest one.
        </p>
      </Section>

      <Section id="sessions" title="Sub-threshold Sessions">
        <p>
          Every Week has {SUB_THRESHOLD_SESSIONS} Sub-threshold Sessions: the third is what builds
          extra load week in, week out. Each is a warm-up, reps with a Recovery between them, and a
          cool-down:
        </p>
        <Formula>
          session = warm-up + reps × rep minutes + (reps − 1) × Recovery + cool-down
        </Formula>
        <p>
          Recoveries follow the guide's ranges, rounded to whole minutes. They are short so the
          effort stays steady while you do more work than a continuous tempo run would allow.
        </p>
        <p>
          The planner picks one 30K session at random, then the 15K and HM sessions closest to half
          of the remaining budget each (<em>planner choice</em>). Up to{' '}
          {hours(SESSION_CAP_UNTIL_MINUTES)} no session has more than {SESSION_WORK_CAP_MINUTES} rep
          minutes (<em>planner choice</em>, matching what sirpoc ran at 7h); above that the easing
          target limits growth instead. Mixing Rep Lengths is for variety: every Rep Format aims for
          the same sub-threshold effort.
        </p>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead className="text-sm text-muted-foreground">
              <tr>
                <th className="py-2 pr-4 font-semibold">Rep Length</th>
                <th className="py-2 pr-4 font-semibold">Recovery</th>
                <th className="py-2 font-semibold">Rep Formats</th>
              </tr>
            </thead>
            <tbody>
              {(Object.keys(RACE_PACES) as RepLength[]).map((repLength) => (
                <tr key={repLength} className="border-t border-foreground/10 align-top">
                  <td className="py-2 pr-4">
                    <span className="font-bold">{repLength}</span>
                    <br />
                    <span className="text-sm text-muted-foreground">{RACE_PACES[repLength]}</span>
                  </td>
                  <td className="py-2 pr-4 whitespace-nowrap">{RECOVERY_MINUTES[repLength]} min</td>
                  <td className="py-2">
                    {REP_FORMATS.filter((f) => f.repLength === repLength)
                      .map((f) => `${f.reps}×${f.repMinutes}′`)
                      .join(', ')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <p>
          New to structured intensity? The sources suggest starting with two sessions: run one of
          the three as an Easy Run at first.
        </p>
      </Section>

      <Section id="days" title="Placing the days">
        <p>
          Sub-threshold Sessions never fall on consecutive days (Sunday and Monday count), so an
          easy day follows each one (<em>planner choice</em>, in line with the guide's example
          week). Each session is sized so that one easy day is enough to recover. With no Day
          Preferences they go on Tuesday, Thursday and Saturday, like the guide's example week (
          <em>planner choice</em>). Which session lands on which day changes from Week to Week.
        </p>
      </Section>

      <Section id="long-run" title="Long Run">
        <p>
          The Long Run is {LONG_RUN_RATIO} × an Easy Run, as Copeland suggests, but never under{' '}
          {MIN_LONG_RUN_MINUTES} or over {MAX_LONG_RUN_MINUTES} min (<em>planner choice</em>, in
          line with the guide's examples). It stays modest so it does not take away from the three
          sessions.
        </p>
        <Formula>
          base Easy Run = (Weekly Duration − session minutes) ÷ (Easy Run days + {LONG_RUN_RATIO})
          <br />
          Long Run = {LONG_RUN_RATIO} × base Easy Run, kept between {MIN_LONG_RUN_MINUTES} and{' '}
          {MAX_LONG_RUN_MINUTES} min
          <br />
          Easy Run = (Weekly Duration − session minutes − Long Run) ÷ Easy Run days
        </Formula>
        <p>
          At lower Weekly Durations the {MIN_LONG_RUN_MINUTES} min minimum makes it more than{' '}
          {LONG_RUN_RATIO} × an Easy Run, and at higher ones the {MAX_LONG_RUN_MINUTES} min maximum
          makes it less. It goes on Sunday, or Saturday if Sunday is taken (<em>planner choice</em>
          ).
        </p>
      </Section>

      <Section id="easy-runs" title="Easy Runs and Rest Days">
        <p>
          The remaining time is split evenly into Easy Runs on the other days. Easy Runs of{' '}
          {SHORT_EASY_RUN_MINUTES} min or less are combined in pairs, and each freed day becomes a
          Rest Day (<em>planner choice</em>).
        </p>
        <p>
          Around 8h and above the sources suggest easy doubles rather than ever-longer single runs;
          the planner plans one run per day.
        </p>
      </Section>

      <Section id="day-preferences" title="Day Preferences">
        <ul className="flex list-disc flex-col gap-1 pl-5">
          <li>
            <strong>Default</strong>: the planner decides.
          </li>
          <li>
            <strong>Rest</strong>: no run.
          </li>
          <li>
            <strong>Easy</strong>: an Easy Run, or a Rest Day if short Easy Runs are combined. Never
            the Long Run or a Sub-threshold Session.
          </li>
          <li>
            <strong>Long</strong>: the Long Run.
          </li>
          <li>
            <strong>SubT</strong>: a Sub-threshold Session.
          </li>
        </ul>
        <p>
          At most {DAY_PREFERENCE_LIMITS.rest} Rest, {DAY_PREFERENCE_LIMITS.easy} Easy,{' '}
          {DAY_PREFERENCE_LIMITS.long} Long and {DAY_PREFERENCE_LIMITS.subT} SubT days, and SubT
          days cannot be next to each other.
        </p>
      </Section>

      <Section id="pacing" title="Pacing">
        <p>
          A session's Rep Length names the race pace for its reps: @15K is 15K race pace, @HM
          half-marathon race pace and @30K 30K race pace. Set them from your current fitness, not a
          personal best or goal time. The planner does not compute paces; the{' '}
          <ExternalLink href={NSM_GUIDE}>Norwegian Singles guide</ExternalLink> covers heart rate
          and effort.
        </p>
      </Section>

      <Section id="shuffle" title="Shuffle">
        <p>
          Each Week is derived from your Plan Settings and its Monday date, so consecutive Weeks
          differ in their Rep Formats and in which session falls on which day, while any one Week
          always comes out the same. Reshuffle changes every Week.
        </p>
      </Section>
    </main>
  )
}

function Section({
  id,
  title,
  children,
}: {
  id: HowItWorksSection
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="flex scroll-mt-4 flex-col gap-3">
      <h2 className="text-xl font-extrabold tracking-tight">{title}</h2>
      {children}
    </section>
  )
}

function Formula({ children }: { children: React.ReactNode }) {
  return <p className="rounded-lg bg-muted px-3 py-2 font-mono text-sm">{children}</p>
}

function ExternalLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <a href={href} className="font-semibold text-primary hover:underline">
      {children}
    </a>
  )
}
