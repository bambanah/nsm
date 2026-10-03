import { Card, CardContent } from '@/components/ui/card'
import type { Day, Week } from '@/planner/planner'

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
        <Stat label="Sub-threshold work" value={week.subThresholdWorkMinutes} unit="min" />
        <Stat label="Sub-threshold share" value={week.subThresholdPercent.toFixed(1)} unit="%" />
      </dl>
      <ol className="grid gap-2 lg:grid-cols-7">
        {week.days.map((day, i) => (
          <DayCell key={day.weekday} day={day} date={dayOfMonth(week.monday, i)} />
        ))}
      </ol>
    </div>
  )
}

function Stat({ label, value, unit }: { label: string; value: number | string; unit: string }) {
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
          {TYPE_LABELS[day.type]}
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

function SessionDetails({ session }: { session: Extract<Day, { type: 'subT' }>['session'] }) {
  const { reps, repMinutes, repLength } = session.repFormat
  const structure = `${session.warmUpMinutes}′ warm-up · 1′ rests · ${session.coolDownMinutes}′ cool-down`
  return (
    <div className="flex flex-col" title={structure}>
      <p className="font-bold">
        {reps}×{repMinutes}′ @{repLength}
      </p>
      <p className="truncate text-sm text-muted-foreground lg:hidden">{structure}</p>
    </div>
  )
}
