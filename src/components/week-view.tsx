import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import type { Day, Week } from '@/planner/planner'

const TYPE_LABELS: Record<Day['type'], string> = {
  subT: 'Sub-threshold',
  easy: 'Easy',
  long: 'Long',
  rest: 'Rest',
}

export function WeekView({ week }: { week: Week }) {
  return (
    <div className="flex flex-col gap-4">
      <dl className="grid grid-cols-3 gap-4 text-sm">
        <Stat label="Total" value={`${week.totalMinutes} min`} />
        <Stat label="Sub-threshold work" value={`${week.subThresholdWorkMinutes} min`} />
        <Stat label="Sub-threshold share" value={`${week.subThresholdPercent.toFixed(1)}%`} />
      </dl>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {week.days.map((day) => (
          <DayCard key={day.weekday} day={day} />
        ))}
      </div>
    </div>
  )
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-lg font-semibold">{value}</dd>
    </div>
  )
}

function DayCard({ day }: { day: Day }) {
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex justify-between">
          <span className="capitalize">{day.weekday}</span>
          <span className="text-muted-foreground font-normal">{TYPE_LABELS[day.type]}</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm">
        {day.type === 'subT' ? (
          <SessionDetails session={day.session} />
        ) : day.type === 'rest' ? (
          <p>Rest day</p>
        ) : (
          <p>{day.minutes} min</p>
        )}
      </CardContent>
    </Card>
  )
}

function SessionDetails({ session }: { session: Extract<Day, { type: 'subT' }>['session'] }) {
  const { reps, repMinutes, repLength } = session.repFormat
  return (
    <div className="flex flex-col gap-1">
      <p>Warm-up {session.warmUpMinutes} min</p>
      <p className="font-medium">
        {reps}×{repMinutes}min @{repLength} ({session.workMinutes}min total)
      </p>
      <p className="text-muted-foreground">1min rest in between</p>
      <p>Cool-down {session.coolDownMinutes} min</p>
      <p className="font-medium">{session.minutes} min</p>
    </div>
  )
}
