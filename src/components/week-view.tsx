import { useState } from 'react'
import { cn } from 'cn'
import { Explained } from '@/components/explained'
import { Card, CardContent } from '@/components/ui/card'
import {
  SHORT_EASY_RUN_MINUTES,
  type Day,
  type SubThresholdSession,
  type Week,
} from '@/planner/planner'
import { RACE_PACES, type RepLength } from '@/planner/rep-formats'
import { formatRepPace, type RepPaces } from '@/planner/rep-paces'

const TYPE_LABELS: Record<Day['type'], string> = {
  subT: 'Sub-threshold',
  easy: 'Easy',
  long: 'Long',
  rest: 'Rest',
}

const dayOfMonth = (monday: string, offset: number) => {
  const [y, m, d] = monday.split('-').map(Number)
  return new Date(y, m - 1, d + offset).getDate()
}

export function WeekView({ week, repPaces }: { week: Week; repPaces?: RepPaces }) {
  const [selected, setSelected] = useState<number>()
  const selectedDay = selected === undefined ? undefined : week.days[selected]
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-3 gap-3">
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
      <ol className="grid gap-2 lg:grid-cols-7">
        {week.days.map((day, i) => (
          <DayCell
            key={day.weekday}
            day={day}
            date={dayOfMonth(week.monday, i)}
            selected={selected === i}
            onSelect={() => setSelected(selected === i ? undefined : i)}
          />
        ))}
      </ol>
      {selectedDay && <DayBreakdown day={selectedDay} repPaces={repPaces} />}
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
  date,
  selected,
  onSelect,
}: {
  day: Day
  date: number
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
      <div className="flex w-10 shrink-0 flex-col items-center leading-tight lg:w-auto lg:flex-row lg:items-baseline lg:justify-between">
        <span className="font-extrabold capitalize">{day.weekday.slice(0, 3)}</span>
        <span className="text-sm font-semibold text-muted-foreground">{date}</span>
      </div>
      <div className="flex min-w-0 flex-1 flex-col gap-0.5 lg:flex-none lg:gap-2">
        <span className="text-xs font-bold" style={{ color }}>
          {day.type === 'rest' && day.merged ? (
            <Explained
              section="easy-runs"
              explanation={`Easy Runs this week would have been ${SHORT_EASY_RUN_MINUTES} min or less, so two were combined into one run and this day became a Rest Day.`}
            >
              {TYPE_LABELS.rest}
            </Explained>
          ) : (
            TYPE_LABELS[day.type]
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
  const { reps, repMinutes, repLength } = session.repFormat
  return (
    <div className="flex flex-col">
      <p className="font-bold">
        {reps}×{repMinutes}′ @{repLength}
      </p>
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

function DayBreakdown({ day, repPaces }: { day: Day; repPaces?: RepPaces }) {
  return (
    <section className="rounded-xl bg-card p-4 ring-1 ring-foreground/10">
      <h2 className="mb-3 text-lg font-extrabold">
        <span className="capitalize">{day.weekday}</span> · {DAY_TITLES[day.type]}
        {day.type !== 'rest' && (
          <span className="ml-2 text-muted-foreground">
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
