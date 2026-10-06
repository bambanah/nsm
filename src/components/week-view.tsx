import { useState } from 'react'
import { ShuffleIcon } from 'lucide-react'
import { cn } from 'cn'
import { Explained } from '@/components/explained'
import { SyncDialog } from '@/components/sync-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
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
  type SubThresholdSession,
  type Weekday,
} from '@/planner/planner'
import { RACE_PACES, REP_FORMATS, type RepFormat, type RepLength } from '@/planner/rep-formats'
import { formatRepPace, type RepPaces } from '@/planner/rep-paces'

export function WeekView({
  settings,
  sessionChoices,
  repPaces,
  hasApiKey,
  syncDisabled,
  onReshuffle,
  onChooseSession,
}: {
  settings: PlanSettings
  sessionChoices: SessionChoice[]
  repPaces?: RepPaces
  hasApiKey: boolean
  syncDisabled: boolean
  onReshuffle: () => void
  onChooseSession: (weekday: Weekday, repFormat?: RepFormat) => void
}) {
  const week = deriveWeek(settings, sessionChoices)
  const [selected, setSelected] = useState<number>()
  const selectedDay = selected === undefined ? undefined : week.days[selected]
  return (
    <div className="flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <dl className="grid flex-1 grid-cols-3 gap-3">
          <Stat label="Total" value={week.totalMinutes} unit="min" />
          <Stat
            label={
              <Explained
                section="budget"
                explanation="Rep minutes only. Warm-ups, cool-downs and Recoveries count as easy time."
              >
                Sub-threshold work
              </Explained>
            }
            value={week.subThresholdWorkMinutes}
            unit="min"
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
            value={week.subThresholdPercent.toFixed(1)}
            unit="%"
          />
        </dl>
        <Button
          variant="secondary"
          size="icon"
          aria-label="Reshuffle"
          title="Reshuffle"
          onClick={onReshuffle}
        >
          <ShuffleIcon />
        </Button>
        <SyncDialog hasApiKey={hasApiKey} disabled={syncDisabled} />
      </div>
      <ol className="grid gap-2 lg:grid-cols-7">
        {week.days.map((day, i) => (
          <DayCell
            key={day.weekday}
            day={day}
            selected={selected === i}
            onSelect={() => setSelected(selected === i ? undefined : i)}
          />
        ))}
      </ol>
      {selectedDay && (
        <DayBreakdown
          day={selectedDay}
          repPaces={repPaces}
          sessionPicker={
            selectedDay.type === 'subT' && (
              <SessionPicker
                day={selectedDay}
                settings={settings}
                sessionChoices={sessionChoices}
                onChoose={(repFormat) => onChooseSession(selectedDay.weekday, repFormat)}
              />
            )
          }
        />
      )}
    </div>
  )
}

function Stat({
  label,
  value,
  unit,
}: {
  label: React.ReactNode
  value: number | string
  unit: string
}) {
  return (
    <Card size="sm">
      <CardContent>
        <dt className="text-sm font-semibold text-muted-foreground">{label}</dt>
        <dd className="text-2xl font-extrabold sm:text-3xl">
          {value}
          <span className="ml-1 text-base font-semibold text-muted-foreground">{unit}</span>
        </dd>
      </CardContent>
    </Card>
  )
}

function DayCell({
  day,
  selected,
  onSelect,
}: {
  day: Day
  selected: boolean
  onSelect: () => void
}) {
  const color = `var(--day-${day.type})`
  return (
    <li
      tabIndex={0}
      aria-expanded={selected}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.target === e.currentTarget && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault()
          onSelect()
        }
      }}
      className={cn(
        'flex cursor-pointer items-center gap-4 rounded-xl border-l-4 p-3 ring-1 lg:min-h-36 lg:flex-col lg:items-stretch lg:gap-2 lg:border-t-4 lg:border-l-0',
        selected ? 'ring-2 ring-foreground/60' : 'ring-foreground/5',
      )}
      style={{ borderColor: color, background: `color-mix(in oklch, ${color} 10%, var(--card))` }}
    >
      <span className="w-10 shrink-0 text-center font-extrabold capitalize lg:w-auto lg:text-left">
        {day.weekday.slice(0, 3)}
      </span>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-none lg:gap-2">
        <span className="text-xs font-bold" style={{ color }}>
          {day.type === 'rest' && day.merged ? (
            <Explained
              section="easy-runs"
              explanation={`Easy Runs this week would have been ${SHORT_EASY_RUN_MINUTES} min or less, so two were combined into one run and this day became a Rest Day.`}
            >
              {DAY_TYPE_LABELS.rest}
            </Explained>
          ) : (
            DAY_TYPE_LABELS[day.type]
          )}
        </span>
        {day.type === 'subT' && <SessionDetails session={day.session} />}
      </div>
      {day.type !== 'rest' && (
        <p className="text-2xl font-extrabold lg:mt-auto">
          {day.type === 'subT' ? day.session.minutes : day.minutes}
          <span className="ml-1 text-sm font-semibold text-muted-foreground">min</span>
        </p>
      )}
    </li>
  )
}

function SessionDetails({ session }: { session: SubThresholdSession }) {
  return (
    <div className="flex flex-col">
      <p className="font-bold">{repFormatLabel(session.repFormat)}</p>
      <p className="truncate text-sm text-muted-foreground lg:hidden">
        {session.warmUpMinutes}′ warm-up · {session.recoveryMinutes}′ Recoveries ·{' '}
        {session.coolDownMinutes}′ cool-down
      </p>
    </div>
  )
}

type StepKind = 'warmUp' | 'rep' | 'recovery' | 'coolDown' | 'easy'

const STEP_COLORS: Record<StepKind, string> = {
  warmUp: 'color-mix(in oklch, var(--day-easy) 55%, var(--card))',
  rep: 'var(--day-subT)',
  recovery: 'color-mix(in oklch, var(--day-easy) 35%, var(--card))',
  coolDown: 'color-mix(in oklch, var(--day-easy) 55%, var(--card))',
  easy: 'var(--day-easy)',
}

const DAY_TITLES: Record<Day['type'], string> = {
  subT: 'Sub-threshold Session',
  easy: 'Easy Run',
  long: 'Long Run',
  rest: 'Rest Day',
}

function steps(day: Day, repPaces?: RepPaces) {
  const raw: { kind: StepKind; minutes: number; label: string }[] = []
  if (day.type === 'subT') {
    const { session } = day
    const { reps, repMinutes, repLength } = session.repFormat
    const pace = repPaces ? ` · ${formatRepPace(repPaces[repLength])}/km` : ''
    raw.push({ kind: 'warmUp', minutes: session.warmUpMinutes, label: 'Warm-up' })
    for (let i = 1; i <= reps; i++) {
      raw.push({ kind: 'rep', minutes: repMinutes, label: `Rep ${i} @${repLength}${pace}` })
      if (i < reps)
        raw.push({ kind: 'recovery', minutes: session.recoveryMinutes, label: 'Recovery' })
    }
    raw.push({ kind: 'coolDown', minutes: session.coolDownMinutes, label: 'Cool-down' })
  } else if (day.type !== 'rest') {
    raw.push({ kind: 'easy', minutes: day.minutes, label: 'Easy pace' })
  }
  let start = 0
  return raw.map((step) => {
    const withStart = { ...step, start }
    start += step.minutes
    return withStart
  })
}

const clock = (minutes: number) =>
  `${Math.floor(minutes / 60)}:${String(minutes % 60).padStart(2, '0')}`

function DayBreakdown({
  day,
  repPaces,
  sessionPicker,
}: {
  day: Day
  repPaces?: RepPaces
  sessionPicker: React.ReactNode
}) {
  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="mb-3 flex flex-wrap items-center gap-x-2 gap-y-1 text-lg font-extrabold">
        <span>
          <span className="capitalize">{day.weekday}</span> · {DAY_TITLES[day.type]}
        </span>
        {sessionPicker}
        {day.type !== 'rest' && (
          <span className="text-muted-foreground">
            {day.type === 'subT' ? day.session.minutes : day.minutes} min
          </span>
        )}
      </h2>
      {day.type === 'rest' ? (
        <p className="text-muted-foreground">No run today.</p>
      ) : (
        <ol>
          {steps(day, repPaces).map((step) => (
            <li
              key={step.start}
              className="flex items-center gap-3 border-b py-1.5 last:border-b-0"
            >
              <span className="w-12 text-sm text-muted-foreground tabular-nums">
                {clock(step.start)}
              </span>
              <span
                className="h-6 w-1.5 shrink-0 rounded-full"
                style={{ background: STEP_COLORS[step.kind] }}
              />
              <span className={step.kind === 'rep' ? 'font-bold' : undefined}>{step.label}</span>
              <span className="ml-auto font-semibold tabular-nums">{step.minutes}′</span>
            </li>
          ))}
        </ol>
      )}
      {day.type === 'subT' && (
        <PaceNote repLength={day.session.repFormat.repLength} repPaces={repPaces} />
      )}
    </section>
  )
}

const repFormatLabel = ({ reps, repMinutes, repLength }: RepFormat) =>
  `${reps}×${repMinutes}′ @${repLength}`

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
      <SelectTrigger size="sm" className="font-extrabold">
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
    <p className="mt-3 text-sm text-muted-foreground">
      {repPaces
        ? `Run the reps at ${formatRepPace(repPaces[repLength])}/km, from your current ${racePace} to slightly slower.`
        : `Run the reps at your current ${racePace}.`}
    </p>
  )
}
