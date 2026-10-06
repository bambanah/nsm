import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { format } from 'date-fns'
import { addDaysTo, mondayOf, parseDate, weekLabel } from '@/lib/week-dates'
import { DAY_TYPE_LABELS, WEEKDAYS, type Week } from '@/planner/planner'
import { repFormatLabel } from '@/planner/rep-formats'
import { syncWeek } from '@/sync/sync.functions'

const weekOf = (monday: string) => ({
  from: parseDate(monday),
  to: parseDate(addDaysTo(monday, 6)),
})

const selectedWeek = (monday?: string) =>
  monday
    ? {
        range_start: parseDate(monday),
        range_middle: {
          from: parseDate(addDaysTo(monday, 1)),
          to: parseDate(addDaysTo(monday, 5)),
        },
        range_end: parseDate(addDaysTo(monday, 6)),
      }
    : {}

export function SyncDialog({
  week,
  hasApiKey,
  disabled,
}: {
  week: Week
  hasApiKey: boolean
  disabled: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [monday, setMonday] = useState<string>()
  const [hovered, setHovered] = useState<string>()
  const [changingKey, setChangingKey] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string>()
  const [syncing, setSyncing] = useState(false)
  const [currentMonday] = useState(() => mondayOf(new Date()))

  const showKeyField = !hasApiKey || changingKey

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (next) return
    setChangingKey(false)
    setApiKey('')
    setError(undefined)
  }

  const sync = async () => {
    if (!monday) return
    setSyncing(true)
    setError(undefined)
    try {
      await syncWeek({ data: { monday, apiKey: showKeyField ? apiKey : undefined } })
      toast.success(`Synced to ${weekLabel(monday)}`)
      onOpenChange(false)
      await router.invalidate()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSyncing(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>
          Sync to intervals.icu
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-fit">
        <DialogHeader>
          <DialogTitle>Sync Week</DialogTitle>
        </DialogHeader>
        <Calendar
          className="bg-transparent"
          numberOfMonths={2}
          weekStartsOn={1}
          defaultMonth={parseDate(currentMonday)}
          disabled={{ before: parseDate(currentMonday) }}
          onDayClick={(day) => setMonday(mondayOf(day))}
          onDayMouseEnter={(day) => setHovered(mondayOf(day))}
          onDayMouseLeave={() => setHovered(undefined)}
          modifiers={{
            ...selectedWeek(monday),
            hovered: hovered && hovered >= currentMonday ? weekOf(hovered) : [],
          }}
          modifiersClassNames={{ hovered: 'bg-muted' }}
        />
        <p className="font-semibold">{monday ? weekLabel(monday) : 'Pick a week'}</p>
        {monday && <Activities week={week} monday={monday} />}
        <div className="flex flex-col gap-2">
          <Label htmlFor="intervals-api-key">intervals.icu API key</Label>
          {showKeyField ? (
            <Input
              id="intervals-api-key"
              type="password"
              autoComplete="off"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
            />
          ) : (
            <p className="text-muted-foreground">
              Saved ·{' '}
              <button
                type="button"
                className="font-semibold text-primary hover:underline"
                onClick={() => setChangingKey(true)}
              >
                Change
              </button>
            </p>
          )}
        </div>
        {error && <p className="text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button
            onClick={sync}
            disabled={!monday || (showKeyField && apiKey.trim() === '') || syncing}
          >
            Sync
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function Activities({ week, monday }: { week: Week; monday: string }) {
  return (
    <ul className="-mt-2 text-sm">
      {week.days.map((day) => {
        if (day.type === 'rest') return null
        const date = parseDate(addDaysTo(monday, WEEKDAYS.indexOf(day.weekday)))
        return (
          <li key={day.weekday} className="flex gap-3 border-b py-1 last:border-b-0">
            <span className="w-20 text-muted-foreground">{format(date, 'EEE d MMM')}</span>
            <span className="font-semibold">
              {DAY_TYPE_LABELS[day.type]}
              {day.type === 'subT' && ` · ${repFormatLabel(day.session.repFormat)}`}
            </span>
            <span className="ml-auto tabular-nums">
              {day.type === 'subT' ? day.session.minutes : day.minutes} min
            </span>
          </li>
        )
      })}
    </ul>
  )
}
