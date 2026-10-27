import { useState } from 'react'
import { ShuffleIcon } from 'lucide-react'
import { cn } from 'cn'
import { Explained } from '@/components/explained'
import { SyncDialog } from '@/components/sync-dialog'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  DAY_TYPE_LABELS,
  deriveWeek,
  exceedsSessionCap,
  SESSION_CAP_UNTIL_MINUTES,
  SESSION_WORK_CAP_MINUTES,
  SHORT_EASY_RUN_MINUTES,
  type Day,
  type PlanSettings,
  type SessionChoice,
  type Week,
  type Weekday,
} from '@/planner/planner'
import {
  RACE_PACES,
  REP_FORMATS,
  repFormatLabel,
  type RepFormat,
  type RepLength,
} from '@/planner/rep-formats'
import {
  formatDuration,
  formatRepPace,
  weeklyDistanceKm,
  type Paces,
  type RepPaces,
} from '@/planner/rep-paces'

export function WeekView({
  settings,
  sessionChoices,
  paces,
  hasApiKey,
  syncDisabled,
  onReshuffle,
  onChooseSession,
}: {
  settings: PlanSettings
  sessionChoices: SessionChoice[]
  paces?: Paces
  hasApiKey: boolean
  syncDisabled: boolean
  onReshuffle: () => void
  onChooseSession: (weekday: Weekday, repFormat?: RepFormat) => void
}) {
  const week = deriveWeek(settings, sessionChoices)
  const [selected, setSelected] = useState(() =>
    Math.max(
      0,
      week.days.findIndex((d) => d.type === 'subT'),
    ),
  )
  const day = week.days[selected]!
  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-px overflow-hidden rounded-lg border bg-border sm:grid-cols-[repeat(4,auto)_1fr]">
        <Stat
          label="Total"
          value={clock(week.totalMinutes)}
          detail={`${week.totalMinutes} min`}
        />
        <Stat
          label={
            <Explained
              section="pacing"
              explanation="An estimate: easy minutes at Easy Pace and rep minutes at the middle of their Rep Pace, with Recoveries counted as no distance."
            >
              Distance
            </Explained>
          }
          value={paces ? `≈ ${Math.round(weeklyDistanceKm(week.days, paces))} km` : '—'}
          detail={paces ? 'upper bound' : 'needs a 5K Time'}
        />
        <Stat
          label={
            <Explained
              section="budget"
              explanation="Rep minutes only. Warm-ups, cool-downs and Recoveries count as easy time."
            >
              Sub-threshold work
            </Explained>
          }
          value={`${week.subThresholdWorkMinutes}′`}
          detail="rep minutes"
        />
        <Stat
          label={
            <Explained
              section="budget"
              explanation={`Sub-threshold work ÷ total running time. The target at this Weekly Duration is ${week.subThresholdTargetPercent}%.`}
            >
              Sub-threshold share
            </Explained>
          }
          value={`${week.subThresholdPercent.toFixed(1)}%`}
          detail={`target ${week.subThresholdTargetPercent}%`}
        >
          <ShareBar week={week} />
        </Stat>
        <div className="col-span-2 flex items-center justify-end gap-2 bg-card px-4 py-2.5 sm:col-span-1">
          <Button
            variant="secondary"
            size="icon"
            aria-label="Reshuffle"
            title="Reshuffle"
            onClick={onReshuffle}
          >
            <ShuffleIcon />
          </Button>
          <SyncDialog week={week} hasApiKey={hasApiKey} disabled={syncDisabled} />
        </div>
      </div>
      <section className="rounded-lg border bg-card p-4">
        <header className="mb-3 flex flex-wrap items-baseline gap-x-4 gap-y-1">
          <h2 className="font-bold">Weekly load</h2>
          <Legend />
        </header>
        <LoadChart days={week.days} selected={selected} onSelect={setSelected} />
      </section>
      <DayBreakdown
        day={day}
        paces={paces}
        sessionPicker={
          day.type === 'subT' && (
            <SessionPicker
              day={day}
              settings={settings}
              sessionChoices={sessionChoices}
              onChoose={(repFormat) => onChooseSession(day.weekday, repFormat)}
            />
          )
        }
      />
    </div>
  )
}

const clock = (minutes: number) =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`

function Stat({
  label,
  value,
  detail,
  children,
}: {
  label: React.ReactNode
  value: React.ReactNode
  detail: string
  children?: React.ReactNode
}) {
  return (
    <div className="flex flex-col bg-card px-4 py-2.5 sm:min-w-36">
      <div className="text-xs font-semibold tracking-wider text-muted-foreground uppercase">
        {label}
      </div>
      <div className="text-xl leading-tight font-extrabold tabular-nums">{value}</div>
      <div className="text-xs text-muted-foreground">{detail}</div>
      {children}
    </div>
  )
}

const SHARE_BAR_MAX_PERCENT = 30

function ShareBar({ week }: { week: Week }) {
  const position = (percent: number) =>
    `${(Math.min(percent, SHARE_BAR_MAX_PERCENT) / SHARE_BAR_MAX_PERCENT) * 100}%`
  return (
    <div className="relative mt-1.5 h-1 rounded-full bg-muted">
      <div
        className="h-1 rounded-full bg-primary"
        style={{ width: position(week.subThresholdPercent) }}
      />
      <div
        className="absolute -top-0.5 h-2 w-0.5 bg-foreground"
        style={{ left: position(week.subThresholdTargetPercent) }}
      />
    </div>
  )
}

type StepKind = 'warmUp' | 'rep' | 'recovery' | 'coolDown' | 'easy'

const EASY_STEP_COLOR = 'color-mix(in oklch, var(--day-easy) 45%, var(--card))'

const stepColor = (kind: StepKind, day: Day) =>
  kind === 'rep' ? 'var(--day-subT)' : kind === 'easy' ? `var(--day-${day.type})` : EASY_STEP_COLOR

const LEGEND = [
  ['Reps', 'var(--day-subT)'],
  ['Warm-up, Recovery, cool-down', EASY_STEP_COLOR],
  ['Easy', 'var(--day-easy)'],
  ['Long', 'var(--day-long)'],
]

function Legend() {
  return (
    <ul className="flex flex-wrap gap-x-3 text-xs text-muted-foreground">
      {LEGEND.map(([label, color]) => (
        <li key={label} className="flex items-center gap-1">
          <span className="size-2 rounded-sm" style={{ background: color }} />
          {label}
        </li>
      ))}
    </ul>
  )
}

const dayMinutes = (day: Day) =>
  day.type === 'subT' ? day.session.minutes : day.type === 'rest' ? 0 : day.minutes

const CHART_HEIGHT = 160
const TICK_MINUTES = 30

function LoadChart({
  days,
  selected,
  onSelect,
}: {
  days: Day[]
  selected: number
  onSelect: (index: number) => void
}) {
  const max = Math.ceil(Math.max(...days.map(dayMinutes)) / TICK_MINUTES) * TICK_MINUTES
  const ticks = Array.from({ length: max / TICK_MINUTES + 1 }, (_, i) => i * TICK_MINUTES)
  const bottom = (minutes: number) => `${(minutes / max) * 100}%`
  return (
    <div className="flex gap-2">
      <div
        className="relative w-6 shrink-0 text-right text-xs text-muted-foreground tabular-nums"
        style={{ height: CHART_HEIGHT }}
      >
        {ticks.map((t) => (
          <span key={t} className="absolute right-0 translate-y-1/2" style={{ bottom: bottom(t) }}>
            {t}
          </span>
        ))}
      </div>
      <div className="relative min-w-0 flex-1">
        <div className="absolute inset-x-0 top-0" style={{ height: CHART_HEIGHT }}>
          {ticks.map((t) => (
            <div key={t} className="absolute inset-x-0 border-t" style={{ bottom: bottom(t) }} />
          ))}
        </div>
        <ol className="relative grid grid-cols-7 gap-1 sm:gap-3">
          {days.map((day, i) => {
            const minutes = dayMinutes(day)
            return (
              <li key={day.weekday}>
                <button
                  type="button"
                  aria-pressed={selected === i}
                  onClick={() => onSelect(i)}
                  className={cn(
                    'flex w-full cursor-pointer flex-col rounded-md text-center text-xs hover:bg-muted/50',
                    selected === i && 'bg-muted/70 hover:bg-muted/70',
                  )}
                >
                  <span className="flex flex-col justify-end" style={{ height: CHART_HEIGHT }}>
                    {minutes > 0 && (
                      <span className="mb-0.5 font-bold tabular-nums">{minutes}′</span>
                    )}
                    <span
                      className="mx-auto flex w-full max-w-10 flex-col-reverse gap-0.5 px-1 sm:px-0"
                      style={{ height: bottom(minutes) }}
                    >
                      {steps(day).map((step, j, all) => (
                        <span
                          key={step.start}
                          title={`${step.label} ${step.minutes}′`}
                          className={cn(j === all.length - 1 && 'rounded-t-sm')}
                          style={{ flexGrow: step.minutes, background: stepColor(step.kind, day) }}
                        />
                      ))}
                    </span>
                  </span>
                  <span
                    className={cn(
                      'flex flex-col px-0.5 pt-1 pb-1.5',
                      selected === i && 'shadow-[inset_0_-2px_0_var(--primary)]',
                    )}
                  >
                    <span className="font-bold capitalize">{day.weekday.slice(0, 3)}</span>
                    <span className="truncate text-muted-foreground">
                      {DAY_TYPE_LABELS[day.type]}
                    </span>
                    {day.type === 'subT' && (
                      <span className="truncate text-muted-foreground max-sm:hidden">
                        {repFormatLabel(day.session.repFormat)}
                      </span>
                    )}
                  </span>
                </button>
              </li>
            )
          })}
        </ol>
      </div>
    </div>
  )
}

const DAY_TITLES: Record<Day['type'], string> = {
  subT: 'Sub-threshold Session',
  easy: 'Easy Run',
  long: 'Long Run',
  rest: 'Rest Day',
}

function steps(day: Day, paces?: Paces) {
  const raw: { kind: StepKind; minutes: number; label: string; pace?: string }[] = []
  const easyPace = paces && `${formatDuration(paces.easy)}/km`
  if (day.type === 'subT') {
    const { session } = day
    const { reps, repMinutes, repLength } = session.repFormat
    const pace = paces && `${formatRepPace(paces.rep[repLength])}/km`
    raw.push({ kind: 'warmUp', minutes: session.warmUpMinutes, label: 'Warm-up', pace: easyPace })
    for (let i = 1; i <= reps; i++) {
      raw.push({ kind: 'rep', minutes: repMinutes, label: `Rep ${i} @${repLength}`, pace })
      if (i < reps)
        raw.push({ kind: 'recovery', minutes: session.recoveryMinutes, label: 'Recovery' })
    }
    raw.push({
      kind: 'coolDown',
      minutes: session.coolDownMinutes,
      label: 'Cool-down',
      pace: easyPace,
    })
  } else if (day.type !== 'rest') {
    raw.push({ kind: 'easy', minutes: day.minutes, label: 'Easy pace', pace: easyPace })
  }
  let start = 0
  return raw.map((step) => {
    const withStart = { ...step, start }
    start += step.minutes
    return withStart
  })
}

const CELL = 'px-2 py-1.5 whitespace-nowrap sm:px-4'

function DayBreakdown({
  day,
  paces,
  sessionPicker,
}: {
  day: Day
  paces?: Paces
  sessionPicker: React.ReactNode
}) {
  return (
    <section className="overflow-hidden rounded-lg border bg-card">
      <header className="flex flex-wrap items-center gap-x-2 gap-y-1 border-b px-4 py-2">
        <h2 className="font-bold">
          <span className="capitalize">{day.weekday}</span> ·{' '}
          {day.type === 'rest' && day.merged ? (
            <Explained
              section="easy-runs"
              explanation={`Easy Runs this week would have been ${SHORT_EASY_RUN_MINUTES} min or less, so two were combined into one run and this day became a Rest Day.`}
            >
              {DAY_TITLES.rest}
            </Explained>
          ) : (
            DAY_TITLES[day.type]
          )}
        </h2>
        {sessionPicker}
        {day.type !== 'rest' && (
          <span className="ml-auto font-semibold tabular-nums">{dayMinutes(day)} min</span>
        )}
      </header>
      {day.type === 'rest' ? (
        <p className={cn(CELL, 'py-2 text-muted-foreground')}>No run today.</p>
      ) : (
        <table className="w-full tabular-nums">
          <thead className="text-xs text-muted-foreground uppercase">
            <tr className="border-b text-left">
              <th className={cn(CELL, 'w-16 font-semibold')}>Start</th>
              <th className={cn(CELL, 'font-semibold')}>Step</th>
              <th className={cn(CELL, 'font-semibold')}>Pace</th>
              <th className={cn(CELL, 'text-right font-semibold')}>Dur</th>
            </tr>
          </thead>
          <tbody>
            {steps(day, paces).map((step) => (
              <tr key={step.start} className="border-b last:border-0 even:bg-muted/30">
                <td className={cn(CELL, 'text-muted-foreground')}>{clock(step.start)}</td>
                <td className={cn(CELL, step.kind === 'rep' && 'font-bold text-primary')}>
                  {step.label}
                </td>
                <td className={cn(CELL, 'text-muted-foreground')}>{step.pace}</td>
                <td className={cn(CELL, 'text-right font-semibold')}>{step.minutes}′</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
      {day.type === 'subT' && (
        <PaceNote repLength={day.session.repFormat.repLength} repPaces={paces?.rep} />
      )}
    </section>
  )
}

const PLANNER = 'planner'

const CAP_REASON = `Over the ${SESSION_WORK_CAP_MINUTES} min per-session cap up to ${SESSION_CAP_UNTIL_MINUTES / 60}h`

function SessionPicker({
  day,
  settings,
  sessionChoices,
  onChoose,
}: {
  day: Extract<Day, { type: 'subT' }>
  settings: PlanSettings
  sessionChoices: SessionChoice[]
  onChoose: (repFormat?: RepFormat) => void
}) {
  const others = sessionChoices.filter((c) => c.weekday !== day.weekday)
  const shareLabel = (repFormat?: RepFormat) =>
    deriveWeek(settings, [
      ...others,
      ...(repFormat ? [{ weekday: day.weekday, repFormat }] : []),
    ]).subThresholdPercent.toFixed(1)
  const plannerLabel = repFormatLabel(day.plannerRepFormat)
  const current = repFormatLabel(day.session.repFormat)
  return (
    <Select
      value={current === plannerLabel ? PLANNER : current}
      onValueChange={(value) =>
        onChoose(
          value === PLANNER || value === plannerLabel
            ? undefined
            : REP_FORMATS.find((f) => repFormatLabel(f) === value),
        )
      }
    >
      <SelectTrigger className="font-extrabold">
        <SelectValue>
          {current}
          {current === plannerLabel && (
            <span className="font-semibold text-muted-foreground">(planner)</span>
          )}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={PLANNER}>
          <ShareOption label={`${plannerLabel} (planner)`} share={shareLabel()} />
        </SelectItem>
        {Object.entries(RACE_PACES).map(([repLength, racePace]) => (
          <SelectGroup key={repLength}>
            <SelectLabel>{racePace}</SelectLabel>
            {REP_FORMATS.filter((f) => f.repLength === repLength).map((f) => {
              const overCap = exceedsSessionCap(f, settings.weeklyDurationMinutes)
              return (
                <SelectItem key={repFormatLabel(f)} value={repFormatLabel(f)} disabled={overCap}>
                  <ShareOption
                    label={repFormatLabel(f)}
                    share={overCap ? undefined : shareLabel(f)}
                    reason={overCap ? CAP_REASON : undefined}
                  />
                </SelectItem>
              )
            })}
          </SelectGroup>
        ))}
      </SelectContent>
    </Select>
  )
}

function ShareOption({ label, share, reason }: { label: string; share?: string; reason?: string }) {
  return (
    <>
      <span className="font-semibold">{label}</span>
      <span className="text-sm text-muted-foreground">
        {share !== undefined ? `${share}% share` : reason}
      </span>
    </>
  )
}

function PaceNote({ repLength, repPaces }: { repLength: RepLength; repPaces?: RepPaces }) {
  const racePace = RACE_PACES[repLength]
  return (
    <p className="border-t px-4 py-2 text-muted-foreground">
      {repPaces
        ? `Run the reps at ${formatRepPace(repPaces[repLength])}/km, from your current ${racePace} to slightly slower.`
        : `Run the reps at your current ${racePace}.`}
    </p>
  )
}
