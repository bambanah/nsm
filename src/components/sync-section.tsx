import { useState } from 'react'
import { useRouter } from '@tanstack/react-router'
import { format, formatDistanceToNow } from 'date-fns'
import { CircleAlertIcon, CircleCheckIcon, HistoryIcon } from 'lucide-react'
import { toast } from 'sonner'
import { cn } from 'cn'
import { SyncDialog } from '@/components/sync-dialog'
import { Button } from '@/components/ui/button'
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
import { weekLabel } from '@/lib/week-dates'
import { WEEKDAYS, type Week, type Weekday } from '@/planner/planner'
import {
  getSyncState,
  saveIntervalsApiKey,
  saveScheduledSync,
  syncWeek,
} from '@/sync/sync.functions'
import { nextSyncTime } from '@/sync/sync-time'

export type SyncState = Awaited<ReturnType<typeof getSyncState>>

type SyncRecord = SyncState['syncHistory'][number]

const HOURS = Array.from({ length: 24 }, (_, hour) => hour)

const formatHour = (hour: number) => `${String(hour).padStart(2, '0')}:00`

const browserTimeZone = () => Intl.DateTimeFormat().resolvedOptions().timeZone

const TRIGGER_LABELS: Record<SyncRecord['trigger'], string> = {
  manual: 'Manual',
  scheduled: 'Scheduled',
}

const OUTCOME_LABELS: Record<SyncRecord['outcome'], string> = {
  succeeded: 'Synced',
  failed: 'Failed',
  skipped: 'Skipped',
}

const OUTCOME_ICONS = {
  succeeded: CircleCheckIcon,
  failed: CircleAlertIcon,
  skipped: HistoryIcon,
}

export function SyncSection({
  week,
  syncState: { hasApiKey, scheduledSync, syncHistory, lastSync },
  disabled,
  isGuest,
}: {
  week: Week
  syncState: SyncState
  disabled: boolean
  isGuest: boolean
}) {
  const [now] = useState(() => new Date())
  // Decided once, so finishing setup doesn't hide the controls being used.
  const [collapsed] = useState(() => hasApiKey && !!scheduledSync?.enabled)
  const next =
    scheduledSync?.enabled &&
    nextSyncTime(scheduledSync.weekday, scheduledSync.hour, scheduledSync.timeZone, now)

  const settings = (
    <div className="grid border-t md:grid-cols-[minmax(0,20rem)_1fr] md:divide-x">
      <div>
        <ScheduledSyncSection scheduledSync={scheduledSync} hasApiKey={hasApiKey} />
        <ApiKeySection hasApiKey={hasApiKey} />
      </div>
      <SyncHistory records={syncHistory} />
    </div>
  )

  return (
    <section className="flex flex-col rounded-lg border bg-card">
      <header className="flex flex-wrap items-center gap-x-4 gap-y-2 p-4">
        <div className="flex flex-1 flex-col gap-0.5">
          <h2 className="font-bold">Sync to intervals.icu</h2>
          {!isGuest && (
            <p className="text-muted-foreground">
              {lastSync ? (
                <>
                  Last Synced{' '}
                  <span
                    className="font-semibold text-foreground"
                    title={format(lastSync.ranAt, 'EEE d MMM HH:mm')}
                  >
                    {formatDistanceToNow(lastSync.ranAt, { addSuffix: true })}
                  </span>{' '}
                  · {weekLabel(lastSync.monday)}
                </>
              ) : (
                'Not Synced yet'
              )}
              {next && ` · Next ${format(next, 'EEE d MMM HH:mm')}`}
            </p>
          )}
        </div>
        <SyncDialog week={week} disabled={disabled || !hasApiKey} isGuest={isGuest} />
      </header>
      {!isGuest &&
        (collapsed ? (
          <details className="border-t">
            <summary className="cursor-pointer px-4 py-2 font-semibold text-muted-foreground">
              Sync settings & history
            </summary>
            {settings}
          </details>
        ) : (
          settings
        ))}
    </section>
  )
}

export function SyncStatus({
  synced,
  latest,
  disabled,
}: {
  synced?: SyncState['recentSyncs'][number]
  latest?: SyncRecord
  disabled: boolean
}) {
  if (!synced && latest?.outcome !== 'failed') return null
  return (
    <div className="flex flex-col gap-2">
      {latest?.outcome === 'failed' && (
        <div
          role="alert"
          className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border border-destructive/50 bg-destructive/10 px-4 py-2 text-destructive"
        >
          <CircleAlertIcon className="size-4 shrink-0" />
          <p className="flex-1">
            Last attempt failed {formatDistanceToNow(latest.ranAt, { addSuffix: true })}:{' '}
            {latest.error}
          </p>
          <SyncAgain monday={latest.monday} disabled={disabled} />
        </div>
      )}
      {synced && (
        <p className="flex flex-wrap items-center gap-x-2 text-muted-foreground">
          <span>
            Week of <span className="font-bold text-foreground">{weekLabel(synced.monday)}</span> ·
            Synced{' '}
            <span title={format(synced.ranAt, 'EEE d MMM HH:mm')}>
              {formatDistanceToNow(synced.ranAt, { addSuffix: true })}
            </span>
          </span>
          {synced.differs && (
            <span className="flex items-center gap-x-2">
              · <span className="font-semibold text-foreground">Differs from your calendar</span> ·
              <SyncAgain monday={synced.monday} disabled={disabled} />
            </span>
          )}
        </p>
      )}
    </div>
  )
}

function SyncAgain({ monday, disabled }: { monday: string; disabled: boolean }) {
  const router = useRouter()
  const [syncing, setSyncing] = useState(false)

  const sync = async () => {
    setSyncing(true)
    try {
      await syncWeek({ data: { monday } })
      toast.success(`Synced to ${weekLabel(monday)}`)
    } catch (e) {
      toast.error((e as Error).message)
    } finally {
      setSyncing(false)
    }
    await router.invalidate()
  }

  return (
    <Button variant="link" className="h-auto p-0" disabled={disabled || syncing} onClick={sync}>
      Sync again
    </Button>
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
    <section className="flex flex-col gap-2 p-4">
      <div className="flex items-center gap-2">
        <Switch
          id="scheduled-sync"
          checked={form.enabled}
          disabled={!hasApiKey && !form.enabled}
          onCheckedChange={(enabled) => save({ enabled })}
        />
        <Label htmlFor="scheduled-sync">Scheduled Sync</Label>
      </div>
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

function ApiKeySection({ hasApiKey }: { hasApiKey: boolean }) {
  const router = useRouter()
  const [changing, setChanging] = useState(false)
  const [apiKey, setApiKey] = useState('')
  const [error, setError] = useState<string>()
  const [saving, setSaving] = useState(false)

  const stopChanging = () => {
    setChanging(false)
    setApiKey('')
    setError(undefined)
  }

  const save = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(undefined)
    try {
      await saveIntervalsApiKey({ data: { apiKey } })
      await router.invalidate()
      stopChanging()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setSaving(false)
    }
  }

  return (
    <section className="flex flex-col gap-2 border-t p-4">
      <Label htmlFor="intervals-api-key">intervals.icu API key</Label>
      {hasApiKey && !changing ? (
        <p className="text-muted-foreground">
          Saved ·{' '}
          <button
            type="button"
            className="font-semibold text-primary hover:underline"
            onClick={() => setChanging(true)}
          >
            Change
          </button>
        </p>
      ) : (
        <form onSubmit={save} className="flex gap-2">
          <Input
            id="intervals-api-key"
            type="password"
            autoComplete="off"
            value={apiKey}
            onChange={(e) => setApiKey(e.target.value)}
          />
          <Button type="submit" variant="secondary" disabled={apiKey.trim() === '' || saving}>
            Save
          </Button>
          {changing && (
            <Button type="button" variant="ghost" onClick={stopChanging}>
              Cancel
            </Button>
          )}
        </form>
      )}
      {!hasApiKey && (
        <p className="text-muted-foreground">
          Save your key to Sync now or turn on Scheduled Sync.
        </p>
      )}
      {error && <p className="text-destructive">{error}</p>}
    </section>
  )
}

function SyncHistory({ records }: { records: SyncRecord[] }) {
  return (
    <section className="flex min-w-0 flex-col gap-1 py-4 max-md:border-t">
      <h3 className="px-4 font-semibold">Sync History</h3>
      {records.length === 0 ? (
        <p className="px-4 text-muted-foreground">No Syncs yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table aria-label="Sync History" className="w-full text-left text-sm">
            <thead className="text-xs tracking-wider text-muted-foreground uppercase">
              <tr className="border-b [&>th]:px-3 [&>th]:py-1.5 [&>th]:font-bold [&>th:first-child]:pl-4 [&>th:last-child]:pr-4">
                <th>Outcome</th>
                <th>Week</th>
                <th>Ran</th>
                <th>Trigger</th>
              </tr>
            </thead>
            <tbody>
              {records.map((r) => {
                const Icon = OUTCOME_ICONS[r.outcome]
                return (
                  <tr
                    key={r.id}
                    className="border-b align-top last:border-b-0 [&>td]:px-3 [&>td]:py-1.5 [&>td:first-child]:pl-4 [&>td:last-child]:pr-4"
                  >
                    <td>
                      <span
                        className={cn(
                          'flex items-center gap-1.5 font-semibold whitespace-nowrap',
                          r.outcome === 'failed' && 'text-destructive',
                          r.outcome === 'skipped' && 'text-muted-foreground',
                        )}
                      >
                        <Icon className="size-4" />
                        {OUTCOME_LABELS[r.outcome]}
                      </span>
                    </td>
                    <td className="whitespace-nowrap">
                      {weekLabel(r.monday)}
                      {r.error && <p className="text-xs text-destructive">{r.error}</p>}
                      {r.outcome === 'skipped' && (
                        <p className="text-xs text-muted-foreground">Already Synced manually</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap text-muted-foreground tabular-nums">
                      {format(r.ranAt, 'EEE d MMM HH:mm')}
                    </td>
                    <td className="text-muted-foreground">{TRIGGER_LABELS[r.trigger]}</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}
    </section>
  )
}
