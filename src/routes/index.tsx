import { useEffect, useState } from 'react'
import { ChevronDownIcon } from 'lucide-react'
import { createFileRoute, Link, redirect, useNavigate, useRouter } from '@tanstack/react-router'
import { Explained } from '@/components/explained'
import { ThemeMenu } from '@/components/theme-menu'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { WeekView } from '@/components/week-view'
import { authClient } from '@/auth/auth-client'
import { getUser } from '@/auth/auth.functions'
import { getPlanSettings, savePlanSettings } from '@/plan-settings/plan-settings.functions'
import { getIntervalsConnection } from '@/sync/sync.functions'
import {
  deleteSessionChoice,
  getSessionChoices,
  setSessionChoice,
} from '@/session-choices/session-choices.functions'
import {
  randomShuffle,
  WEEKDAYS,
  type DayPreference,
  type PlanSettings,
  type Weekday,
} from '@/planner/planner'
import { REP_LENGTHS, type RepFormat } from '@/planner/rep-formats'
import { formatDuration, formatRepPace, repPaces } from '@/planner/rep-paces'
import {
  DAY_PREFERENCE_LIMITS,
  validatePlanSettings,
  type PlanSettingsError,
} from '@/planner/validate'

export const Route = createFileRoute('/')({
  ssr: 'data-only',
  beforeLoad: async () => {
    const user = await getUser()
    if (!user) throw redirect({ to: '/sign-in' })
    return { user }
  },
  loader: async () => {
    const [settings, sessionChoices, connection] = await Promise.all([
      getPlanSettings(),
      getSessionChoices(),
      getIntervalsConnection(),
    ])
    return { settings, sessionChoices, hasApiKey: connection.hasApiKey }
  },
  component: Home,
})

interface FormState {
  hours: string
  minutes: string
  warmUp: string
  coolDown: string
  dayPreferences: PlanSettings['dayPreferences']
  shuffle: number
  fiveKTime: string
}

const toForm = (s: PlanSettings): FormState => ({
  hours: String(Math.floor(s.weeklyDurationMinutes / 60)),
  minutes: String(s.weeklyDurationMinutes % 60),
  warmUp: String(s.warmUpMinutes),
  coolDown: String(s.coolDownMinutes),
  dayPreferences: s.dayPreferences,
  shuffle: s.shuffle,
  fiveKTime: s.fiveKSeconds === null ? '' : formatDuration(s.fiveKSeconds),
})

const parseMinutes = (value: string) => (value === '' ? Number.NaN : Number(value))

function parseFiveKTime(value: string) {
  const trimmed = value.trim()
  if (trimmed === '') return null
  const match = /^(\d{1,2}):([0-5]\d)$/.exec(trimmed)
  return match ? Number(match[1]) * 60 + Number(match[2]) : Number.NaN
}

const samePlanSettings = (a: PlanSettings, b: PlanSettings) =>
  a.weeklyDurationMinutes === b.weeklyDurationMinutes &&
  a.warmUpMinutes === b.warmUpMinutes &&
  a.coolDownMinutes === b.coolDownMinutes &&
  a.shuffle === b.shuffle &&
  a.fiveKSeconds === b.fiveKSeconds &&
  WEEKDAYS.every((d) => a.dayPreferences[d] === b.dayPreferences[d])

const toSettings = (f: FormState): PlanSettings => ({
  weeklyDurationMinutes:
    f.hours === '' && f.minutes === '' ? Number.NaN : Number(f.hours) * 60 + Number(f.minutes),
  warmUpMinutes: parseMinutes(f.warmUp),
  coolDownMinutes: parseMinutes(f.coolDown),
  dayPreferences: f.dayPreferences,
  shuffle: f.shuffle,
  fiveKSeconds: parseFiveKTime(f.fiveKTime),
})

const STAT_LABEL = 'text-xs font-semibold tracking-wider text-muted-foreground uppercase'

const PREFERENCE_LABELS: Record<DayPreference, string> = {
  default: 'Default',
  rest: 'Rest',
  easy: 'Easy',
  long: 'Long',
  subT: 'SubT',
}

function Home() {
  const { settings: saved, sessionChoices, hasApiKey } = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const navigate = useNavigate()
  const [form, setForm] = useState<FormState>(() =>
    saved
      ? toForm(saved)
      : {
          hours: '',
          minutes: '',
          warmUp: '10',
          coolDown: '10',
          dayPreferences: {},
          shuffle: randomShuffle(),
          fiveKTime: '',
        },
  )
  const [actionError, setActionError] = useState<string>()
  const [expanded, setExpanded] = useState(!saved)

  const settings = toSettings(form)
  const errors = validatePlanSettings(settings)
  const paces = settings.fiveKSeconds ? repPaces(settings.fiveKSeconds) : undefined
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  useEffect(() => {
    const next = toSettings(form)
    if (validatePlanSettings(next).length > 0 || (saved && samePlanSettings(next, saved))) return
    const timeout = setTimeout(async () => {
      setActionError(undefined)
      try {
        await savePlanSettings({ data: next })
        await router.invalidate()
      } catch (e) {
        setActionError((e as Error).message)
      }
    }, 600)
    return () => clearTimeout(timeout)
  }, [form, saved, router])

  const chooseSession = async (weekday: Weekday, repFormat?: RepFormat) => {
    setActionError(undefined)
    try {
      await (repFormat
        ? setSessionChoice({ data: { weekday, repFormat } })
        : deleteSessionChoice({ data: { weekday } }))
      await router.invalidate()
    } catch (e) {
      setActionError((e as Error).message)
    }
  }

  const signOut = async () => {
    await authClient.signOut()
    await navigate({ to: '/sign-in' })
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <div className="flex items-baseline gap-4">
          <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">NSM</h1>
          <Link to="/how-it-works" className="font-semibold text-primary hover:underline">
            How this works
          </Link>
        </div>
        <div className="flex items-center gap-3">
          <span className="hidden text-muted-foreground sm:inline">{user.name}</span>
          <ThemeMenu />
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <Card size="sm">
        <CardContent className="flex flex-col gap-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-lg font-semibold">
              {form.hours || 0}h {form.minutes || 0}m · {form.warmUp}′ warm-up · {form.coolDown}′
              cool-down
              {WEEKDAYS.filter((d) => form.dayPreferences[d]).map((d) => (
                <span key={d} className="text-muted-foreground capitalize">
                  {' '}
                  · {d.slice(0, 3)} {PREFERENCE_LABELS[form.dayPreferences[d]!]}
                </span>
              ))}
            </p>
            <Button
              variant="outline"
              aria-expanded={expanded}
              onClick={() => setExpanded(!expanded)}
            >
              Edit
              <ChevronDownIcon className={expanded ? 'rotate-180' : undefined} />
            </Button>
          </div>
          <div className="flex flex-col gap-2 border-t pt-4">
            <div className="flex flex-wrap items-end gap-x-8 gap-y-3">
              <div className="flex flex-col gap-1">
                <Label htmlFor="five-k-time" className={STAT_LABEL}>
                  5K Time
                </Label>
                <Input
                  id="five-k-time"
                  className="h-auto w-24 py-0.5 text-2xl font-extrabold tabular-nums"
                  placeholder="19:45"
                  value={form.fiveKTime}
                  onChange={(e) => update({ fiveKTime: e.target.value })}
                />
              </div>
              {paces &&
                REP_LENGTHS.map((repLength) => (
                  <div key={repLength} className="flex flex-col gap-1">
                    <span className={STAT_LABEL}>{repLength} pace</span>
                    <span className="text-2xl font-extrabold text-primary tabular-nums">
                      {formatRepPace(paces[repLength])}
                      <span className="ml-0.5 text-sm font-semibold text-muted-foreground">
                        /km
                      </span>
                    </span>
                  </div>
                ))}
            </div>
            {errors
              .filter((e) => e.field === 'fiveKTime')
              .map((e) => (
                <p key={e.message} className="text-destructive">
                  {e.message}
                </p>
              ))}
          </div>
          {expanded && (
            <>
              <div className="flex flex-wrap gap-5">
                <Field label="Weekly Duration" errors={errors} field="weeklyDuration">
                  <div className="flex items-center gap-2 text-lg font-semibold">
                    <NumberInput
                      value={form.hours}
                      max={9}
                      onChange={(hours) =>
                        update({
                          hours,
                          minutes: hours !== '' && form.minutes === '' ? '0' : form.minutes,
                        })
                      }
                    />
                    <span>h</span>
                    <NumberInput
                      value={form.minutes}
                      max={59}
                      onChange={(minutes) => update({ minutes })}
                    />
                    <span>m</span>
                  </div>
                </Field>
                <Field label="Warm-up (min)" errors={errors} field="warmUp">
                  <NumberInput
                    value={form.warmUp}
                    max={99}
                    onChange={(warmUp) => update({ warmUp })}
                  />
                </Field>
                <Field label="Cool-down (min)" errors={errors} field="coolDown">
                  <NumberInput
                    value={form.coolDown}
                    max={99}
                    onChange={(coolDown) => update({ coolDown })}
                  />
                </Field>
              </div>
              <Field
                label={
                  <Explained
                    section="day-preferences"
                    explanation={`Default leaves the day to the planner. At most ${DAY_PREFERENCE_LIMITS.rest} Rest, ${DAY_PREFERENCE_LIMITS.easy} Easy, ${DAY_PREFERENCE_LIMITS.long} Long and ${DAY_PREFERENCE_LIMITS.subT} SubT days, and SubT days cannot be next to each other.`}
                  >
                    Day Preferences
                  </Explained>
                }
                errors={errors}
                field="dayPreferences"
              >
                <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4 lg:grid-cols-7">
                  {WEEKDAYS.map((weekday) => (
                    <div key={weekday} className="flex flex-col gap-1">
                      <Label className="text-sm text-muted-foreground capitalize">
                        {weekday.slice(0, 3)}
                      </Label>
                      <Select
                        value={form.dayPreferences[weekday] ?? 'default'}
                        onValueChange={(value: DayPreference) => {
                          const { [weekday]: _, ...rest } = form.dayPreferences
                          update({
                            dayPreferences:
                              value === 'default' ? rest : { ...rest, [weekday]: value },
                          })
                        }}
                      >
                        <SelectTrigger className="w-full font-semibold">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {Object.entries(PREFERENCE_LABELS).map(([value, label]) => (
                            <SelectItem key={value} value={value}>
                              {label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  ))}
                </div>
              </Field>
            </>
          )}
          {[
            ...(expanded
              ? []
              : errors.filter((e) => e.field !== 'fiveKTime').map((e) => e.message)),
            ...(actionError ? [actionError] : []),
          ].map((message) => (
            <p key={message} className="-mt-3 text-destructive">
              {message}
            </p>
          ))}
        </CardContent>
      </Card>

      {errors.length === 0 && (
        <WeekView
          settings={settings}
          sessionChoices={sessionChoices}
          repPaces={paces}
          hasApiKey={hasApiKey}
          syncDisabled={!saved || !samePlanSettings(settings, saved)}
          onReshuffle={() => update({ shuffle: randomShuffle() })}
          onChooseSession={chooseSession}
        />
      )}
    </main>
  )
}

function Field({
  label,
  errors,
  field,
  children,
}: {
  label: React.ReactNode
  errors: PlanSettingsError[]
  field: PlanSettingsError['field']
  children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2">
      <Label>{label}</Label>
      {children}
      {errors
        .filter((e) => e.field === field)
        .map((e) => (
          <p key={e.message} className="text-destructive">
            {e.message}
          </p>
        ))}
    </div>
  )
}

function NumberInput({
  value,
  max,
  onChange,
}: {
  value: string
  max: number
  onChange: (value: string) => void
}) {
  return (
    <Input
      className="w-18 text-lg"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const next = e.target.value
        if (/^\d*$/.test(next) && (next === '' || Number(next) <= max)) onChange(next)
      }}
    />
  )
}
