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
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Switch } from '@/components/ui/switch'
import { format } from 'date-fns'
import { addDaysTo, mondayOf, parseDate, weekLabel } from '@/lib/week-dates'
import { DAY_TYPE_LABELS, WEEKDAYS, type Week, type Weekday } from '@/planner/planner'
import { repFormatLabel } from '@/planner/rep-formats'
import { getSyncState, saveScheduledSync, syncWeek } from '@/sync/sync.functions'

export type SyncState = Awaited<ReturnType<typeof getSyncState>>

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

type SyncRecord = SyncState['syncHistory'][number]

const TRIGGER_LABELS: Record<SyncRecord['trigger'], string> = {
  manual: 'Manual',
  scheduled: 'Scheduled',
}

const OUTCOME_LABELS: Record<SyncRecord['outcome'], string> = {
  succeeded: 'Succeeded',
  failed: 'Failed',
  skipped: 'Skipped, already Synced manually',
}

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
  syncState: { hasApiKey, scheduledSync, syncHistory },
  disabled,
  isGuest,
}: {
  week: Week
  syncState: SyncState
  disabled: boolean
  isGuest: boolean
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
          <span className="max-sm:flex-1">
            <Button variant="secondary" className="w-full" disabled>
              Sync to intervals.icu
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
        <Button variant="secondary" className="max-sm:flex-1" disabled={disabled}>
          Sync to intervals.icu
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
        <ScheduledSyncSection scheduledSync={scheduledSync} hasApiKey={hasApiKey} />
        <SyncHistory records={syncHistory} />
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

function ScheduledSyncSection({
  scheduledSync,
  hasApiKey,
}: {
  scheduledSync: SyncState['scheduledSync']
  hasApiKey: boolean
}) {
  const router = useRouter()
  const [form, setForm] = useState(
    () =>
      scheduledSync ?? {
        enabled: false,
        weekday: 'sunday' as Weekday,
        hour: 18,
        timeZone: browserTimeZone(),
      },
  )
  const [error, setError] = useState<string>()

  const save = async (patch: Partial<typeof form>) => {
    const next = { ...form, ...patch, timeZone: browserTimeZone() }
    setForm(next)
    setError(undefined)
    try {
      await saveScheduledSync({ data: next })
      await router.invalidate()
    } catch (e) {
      setForm(form)
      setError((e as Error).message)
    }
  }

  return (
    <section className="flex flex-col gap-2 border-t pt-4">
      <div className="flex items-center gap-2">
        <Switch
          id="scheduled-sync"
          checked={form.enabled}
          disabled={!hasApiKey && !form.enabled}
          onCheckedChange={(enabled) => save({ enabled })}
        />
        <Label htmlFor="scheduled-sync">Scheduled Sync</Label>
      </div>
      {!hasApiKey && (
        <p className="text-muted-foreground">Save an intervals.icu API key to turn it on.</p>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-muted-foreground">Every</span>
        <Select
          value={form.weekday}
          disabled={!form.enabled}
          onValueChange={(weekday: Weekday) => save({ weekday })}
        >
          <SelectTrigger size="sm" aria-label="Sync Time weekday" className="capitalize">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {WEEKDAYS.map((weekday) => (
              <SelectItem key={weekday} value={weekday} className="capitalize">
                {weekday}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">at</span>
        <Select
          value={String(form.hour)}
          disabled={!form.enabled}
          onValueChange={(hour) => save({ hour: Number(hour) })}
        >
          <SelectTrigger size="sm" aria-label="Sync Time hour" className="tabular-nums">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {HOURS.map((hour) => (
              <SelectItem key={hour} value={String(hour)} className="tabular-nums">
                {formatHour(hour)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <span className="text-muted-foreground">{form.timeZone}</span>
      </div>
      {error && <p className="text-destructive">{error}</p>}
    </section>
  )
}

function SyncHistory({ records }: { records: SyncState['syncHistory'] }) {
  return (
    <section className="flex flex-col gap-1 border-t pt-4">
      <h3 className="font-semibold">Sync History</h3>
      {records.length === 0 ? (
        <p className="text-muted-foreground">No Syncs yet</p>
      ) : (
        <ul aria-label="Sync History" className="text-sm">
          {records.map((r) => (
            <li key={r.id} className="border-b py-1 last:border-b-0">
              <div className="flex flex-wrap gap-x-3">
                <span className="text-muted-foreground tabular-nums">
                  {format(r.ranAt, 'd MMM HH:mm')}
                </span>
                <span>{weekLabel(r.monday)}</span>
                <span className="text-muted-foreground">{TRIGGER_LABELS[r.trigger]}</span>
                <span
                  className={
                    r.outcome === 'failed' ? 'font-semibold text-destructive' : 'font-semibold'
                  }
                >
                  {OUTCOME_LABELS[r.outcome]}
                </span>
              </div>
              {r.error && <p className="text-destructive">{r.error}</p>}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
