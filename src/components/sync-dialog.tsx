import { useState } from 'react'
import { Link, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { HoverPopover } from '@/components/hover-popover'
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
  disabled,
  isGuest,
}: {
  week: Week
  disabled: boolean
  isGuest: boolean
}) {
  const router = useRouter()
  const [open, setOpen] = useState(false)
  const [monday, setMonday] = useState<string>()
  const [hovered, setHovered] = useState<string>()
  const [error, setError] = useState<string>()
  const [syncing, setSyncing] = useState(false)
  const [currentMonday] = useState(() => mondayOf(new Date()))

  const onOpenChange = (next: boolean) => {
    setOpen(next)
    if (!next) setError(undefined)
  }

  const sync = async () => {
    if (!monday) return
    setSyncing(true)
    setError(undefined)
    try {
      await syncWeek({ data: { monday } })
      toast.success(`Synced to ${weekLabel(monday)}`)
      onOpenChange(false)
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSyncing(false)
    }
    await router.invalidate()
  }

  if (isGuest)
    return (
      <HoverPopover
        trigger={
          <span>
            <Button variant="secondary" disabled>
              Sync now
            </Button>
          </span>
        }
      >
        <p>
          <Link to="/sign-in" className="font-semibold text-primary hover:underline">
            Sign in
          </Link>{' '}
          to Sync to intervals.icu
        </p>
      </HoverPopover>
    )

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>
          Sync now
        </Button>
      </DialogTrigger>
      <DialogContent className="max-h-[calc(100dvh-2rem)] overflow-y-auto sm:max-w-fit">
        <DialogHeader>
          <DialogTitle>Sync Week</DialogTitle>
        </DialogHeader>
        <Calendar
          // Below md the months stack, so show only the first
          className="bg-transparent max-md:mx-auto max-md:[&_.rdp-month~.rdp-month]:hidden"
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
        {error && <p className="text-destructive">{error}</p>}
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Cancel</Button>
          </DialogClose>
          <Button onClick={sync} disabled={!monday || syncing}>
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
