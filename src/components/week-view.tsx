import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Day, Week } from '@/planner/planner'

const TYPE_LABELS: Record<Day['type'], string> = {
  subT: 'Sub-threshold',
  easy: 'Easy',
  long: 'Long',
  rest: 'Rest',
}

const dayMinutes = (day: Day) =>
  day.type === 'subT' ? day.session.minutes : day.type === 'rest' ? 0 : day.minutes

export function WeekView({ week }: { week: Week }) {
  const maxMinutes = Math.max(...week.days.map(dayMinutes))
  return (
    <div className="flex flex-col gap-5">
      <dl className="grid grid-cols-3 gap-3">
        <Stat label="Total" value={week.totalMinutes} unit="min" />
        <Stat label="Sub-threshold work" value={week.subThresholdWorkMinutes} unit="min" />
        <Stat label="Sub-threshold share" value={week.subThresholdPercent.toFixed(1)} unit="%" />
      </dl>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {week.days.map((day) => (
          <DayCard key={day.weekday} day={day} maxMinutes={maxMinutes} />
        ))}
      </div>
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

function DayCard({ day, maxMinutes }: { day: Day; maxMinutes: number }) {
  const color = `var(--day-${day.type})`
  const minutes = dayMinutes(day)
  return (
    <Card
      size="sm"
      className="gap-2.5 shadow-none ring-foreground/5"
      style={{ background: `color-mix(in oklch, ${color} 14%, var(--card))` }}
    >
      <CardHeader>
        <CardTitle className="flex items-center justify-between font-extrabold">
          <span className="capitalize">{day.weekday}</span>
          <span
            className="rounded-md px-2 py-0.5 text-xs font-bold"
            style={{ background: `color-mix(in oklch, ${color} 28%, var(--card))` }}
          >
            {TYPE_LABELS[day.type]}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-2.5">
        {day.type === 'subT' && <SessionDetails session={day.session} />}
        <div className="mt-auto flex flex-col gap-1.5">
          <p className="text-2xl font-extrabold">
            {day.type === 'rest' ? (
              <span className="text-muted-foreground">Rest</span>
            ) : (
              <>
                {minutes}
                <span className="ml-1 text-base font-semibold text-muted-foreground">min</span>
              </>
            )}
          </p>
          <div
            className="h-1.5 rounded-full"
            style={{ background: `color-mix(in oklch, ${color} 25%, var(--card))` }}
          >
            <div
              className="h-full rounded-full"
              style={{ width: `${(minutes / maxMinutes) * 100}%`, background: color }}
            />
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

function SessionDetails({ session }: { session: Extract<Day, { type: 'subT' }>['session'] }) {
  const { reps, repMinutes, repLength } = session.repFormat
  return (
    <div className="flex flex-col gap-0.5">
      <p className="text-2xl font-extrabold">
        {reps}×{repMinutes}′
        <span className="ml-2 text-base font-semibold text-muted-foreground">@{repLength}</span>
      </p>
      <p className="text-sm text-muted-foreground">
        {session.warmUpMinutes}′ warm-up · 1′ rests · {session.coolDownMinutes}′ cool-down
      </p>
    </div>
  )
}
