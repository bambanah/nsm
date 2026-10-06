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
import { addDaysTo, mondayOf, parseDate, weekLabel } from '@/lib/week-dates'
import { syncWeek } from '@/sync/sync.functions'

const weekOf = (monday: string) => ({
  from: parseDate(monday),
  to: parseDate(addDaysTo(monday, 6)),
})

export function SyncDialog({ hasApiKey, disabled }: { hasApiKey: boolean; disabled: boolean }) {
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
          mode="range"
          numberOfMonths={2}
          weekStartsOn={1}
          defaultMonth={parseDate(currentMonday)}
          disabled={{ before: parseDate(currentMonday) }}
          selected={monday ? weekOf(monday) : undefined}
          onDayClick={(day) => setMonday(mondayOf(day))}
          onDayMouseEnter={(day) => setHovered(mondayOf(day))}
          onDayMouseLeave={() => setHovered(undefined)}
          modifiers={{ hovered: hovered && hovered >= currentMonday ? weekOf(hovered) : [] }}
          modifiersClassNames={{ hovered: 'bg-muted' }}
        />
        <p className="font-semibold">{monday ? weekLabel(monday) : 'Pick a week'}</p>
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
