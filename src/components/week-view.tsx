import { Explained } from '@/components/explained'
import { Card, CardContent } from '@/components/ui/card'
import {
  LONG_RUN_RATIO,
  MAX_LONG_RUN_MINUTES,
  MIN_LONG_RUN_MINUTES,
  SHORT_EASY_RUN_MINUTES,
  type Day,
  type SubThresholdSession,
  type Week,
} from '@/planner/planner'
import { RACE_PACES } from '@/planner/rep-formats'

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

export function WeekView({ week }: { week: Week }) {
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
          <DayCell key={day.weekday} day={day} date={dayOfMonth(week.monday, i)} />
        ))}
      </ol>
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

function DayCell({ day, date }: { day: Day; date: number }) {
  const color = `var(--day-${day.type})`
  return (
    <li
      className="flex items-center gap-4 rounded-xl border-l-4 p-3 ring-1 ring-foreground/5 lg:min-h-36 lg:flex-col lg:items-stretch lg:gap-2 lg:border-t-4 lg:border-l-0"
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
          {day.type === 'subT' ? (
            <Explained section="sessions" explanation={sessionBreakdown(day.session)}>
              {day.session.minutes}
            </Explained>
          ) : day.type === 'long' ? (
            <Explained section="long-run" explanation={longRunBreakdown(day)}>
              {day.minutes}
            </Explained>
          ) : (
            day.minutes
          )}
          <span className="ml-1 text-sm font-semibold text-muted-foreground">min</span>
        </p>
      )}
    </li>
  )
}

function sessionBreakdown(session: SubThresholdSession) {
  const { reps, repMinutes } = session.repFormat
  return `${session.warmUpMinutes}′ warm-up + ${reps}×${repMinutes}′ reps + ${reps - 1}×${session.recoveryMinutes}′ Recovery + ${session.coolDownMinutes}′ cool-down = ${session.minutes} min.`
}

function longRunBreakdown(day: Extract<Day, { type: 'long' }>) {
  if (day.minutes === day.ratioMinutes)
    return `About ${LONG_RUN_RATIO} × a ${Math.round(day.baseEasyRunMinutes)} min Easy Run.`
  return day.minutes === MIN_LONG_RUN_MINUTES
    ? `${LONG_RUN_RATIO} × an Easy Run would be ${day.ratioMinutes} min, so it is raised to the ${MIN_LONG_RUN_MINUTES} min minimum.`
    : `${LONG_RUN_RATIO} × an Easy Run would be ${day.ratioMinutes} min, so it is lowered to the ${MAX_LONG_RUN_MINUTES} min maximum.`
}

function SessionDetails({ session }: { session: SubThresholdSession }) {
  const { reps, repMinutes, repLength } = session.repFormat
  return (
    <div className="flex flex-col">
      <p className="font-bold">
        {reps}×{repMinutes}′{' '}
        <Explained
          section="pacing"
          explanation={`Run the reps at your current ${RACE_PACES[repLength]}.`}
        >
          @{repLength}
        </Explained>
      </p>
      <p className="truncate text-sm text-muted-foreground lg:hidden">
        {session.warmUpMinutes}′ warm-up · {session.recoveryMinutes}′ Recoveries ·{' '}
        {session.coolDownMinutes}′ cool-down
      </p>
    </div>
  )
}
