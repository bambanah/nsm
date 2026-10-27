import { useCallback, useEffect, useState } from 'react'
import { createFileRoute, useNavigate, useRouter } from '@tanstack/react-router'
import { toast } from 'sonner'
import { Explained } from '@/components/explained'
import { AppHeader } from '@/components/app-header'
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
import { loadGuestPlan, saveGuestPlan, type GuestPlan } from '@/guest/guest-plan'
import { getPlanSettings, savePlanSettings } from '@/plan-settings/plan-settings.functions'
import { getIntervalsConnection } from '@/sync/sync.functions'
import {
  deleteSessionChoice,
  getSessionChoices,
  setSessionChoice,
} from '@/session-choices/session-choices.functions'
import {
  deadSessionChoices,
  randomShuffle,
  sessionChoiceError,
  WEEKDAYS,
  type DayPreference,
  type PlanSettings,
  type SessionChoice,
  type Weekday,
} from '@/planner/planner'
import { REP_LENGTHS, type RepFormat } from '@/planner/rep-formats'
import { formatDuration, formatRepPace, derivePaces } from '@/planner/rep-paces'
import {
  DAY_PREFERENCE_LIMITS,
  validatePlanSettings,
  type PlanSettingsError,
} from '@/planner/validate'

export const Route = createFileRoute('/')({
  ssr: 'data-only',
  head: () => ({ meta: [{ title: 'NSM | Planner' }] }),
  beforeLoad: async () => ({ user: await getUser() }),
  loader: async ({ context: { user } }) => {
    if (!user) return { settings: null, sessionChoices: [], hasApiKey: false }
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

const PREFERENCE_LABELS: Record<DayPreference, string> = {
  default: 'Default',
  rest: 'Rest',
  easy: 'Easy',
  long: 'Long',
  subT: 'SubT',
}

function Home() {
  const { user } = Route.useRouteContext()
  return <Planner key={user?.id ?? 'guest'} />
}

const GUEST_WARNED_KEY = 'guestWarned'
const NO_SESSION_CHOICES: SessionChoice[] = []

function Planner() {
  const loaded = Route.useLoaderData()
  const { user } = Route.useRouteContext()
  const router = useRouter()
  const navigate = useNavigate()
  const [guestPlan, setGuestPlan] = useState(() => (user ? null : loadGuestPlan()))
  const saved = user ? loaded.settings : (guestPlan?.settings ?? null)
  const sessionChoices = user
    ? loaded.sessionChoices
    : (guestPlan?.sessionChoices ?? NO_SESSION_CHOICES)
  const [initialForm] = useState<FormState>(() =>
    saved
      ? toForm(saved)
      : {
          hours: user ? '' : '6',
          minutes: user ? '' : '0',
          warmUp: '10',
          coolDown: '10',
          dayPreferences: {},
          shuffle: randomShuffle(),
          fiveKTime: '',
        },
  )
  const [form, setForm] = useState(initialForm)
  const [initialSettings] = useState(() => toSettings(initialForm))
  const baseline = user || saved ? saved : initialSettings
  const [actionError, setActionError] = useState<string>()

  const settings = toSettings(form)
  const errors = validatePlanSettings(settings)
  const paces = settings.fiveKSeconds ? derivePaces(settings.fiveKSeconds) : undefined
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const saveGuest = useCallback(
    (plan: GuestPlan) => {
      saveGuestPlan(plan)
      setGuestPlan(plan)
      try {
        if (sessionStorage.getItem(GUEST_WARNED_KEY)) return
        sessionStorage.setItem(GUEST_WARNED_KEY, 'true')
      } catch {}
      toast('Saved on this device only. Sign in to plan from other devices.', {
        action: { label: 'Sign in', onClick: () => navigate({ to: '/sign-in' }) },
      })
    },
    [navigate],
  )

  useEffect(() => {
    const next = toSettings(form)
    if (validatePlanSettings(next).length > 0 || (baseline && samePlanSettings(next, baseline)))
      return
    const timeout = setTimeout(async () => {
      setActionError(undefined)
      if (!user) {
        const dead = deadSessionChoices(next, sessionChoices)
        return saveGuest({
          settings: next,
          sessionChoices: sessionChoices.filter((c) => !dead.includes(c)),
        })
      }
      try {
        await savePlanSettings({ data: next })
        await router.invalidate()
      } catch (e) {
        setActionError((e as Error).message)
      }
    }, 600)
    return () => clearTimeout(timeout)
  }, [form, baseline, sessionChoices, user, router, saveGuest])

  const chooseGuestSession = (weekday: Weekday, repFormat?: RepFormat) => {
    const others = sessionChoices.filter((c) => c.weekday !== weekday)
    if (!repFormat) return saveGuest({ settings, sessionChoices: others })
    const choice = { weekday, repFormat }
    const error = sessionChoiceError(settings, choice)
    if (error) return setActionError(error)
    saveGuest({ settings, sessionChoices: [...others, choice] })
  }

  const chooseSession = async (weekday: Weekday, repFormat?: RepFormat) => {
    setActionError(undefined)
    if (!user) return chooseGuestSession(weekday, repFormat)
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
    await router.invalidate()
  }

  return (
    <div className="flex min-h-dvh flex-col text-sm">
      {user ? <AppHeader user={user} onSignOut={signOut} /> : <AppHeader showSignIn />}
      <div className="grid flex-1 grid-cols-1 md:grid-cols-[18rem_1fr]">
        <aside className="flex flex-col gap-5 bg-card p-4 max-md:order-last max-md:border-t md:border-r">
          <Section title="Plan">
            <Row label="Weekly Duration" htmlFor="weekly-hours">
              <NumberInput
                id="weekly-hours"
                aria-label="Weekly Duration hours"
                value={form.hours}
                max={9}
                onChange={(hours) =>
                  update({
                    hours,
                    minutes: hours !== '' && form.minutes === '' ? '0' : form.minutes,
                  })
                }
              />
              <span className="text-muted-foreground">h</span>
              <NumberInput
                aria-label="Weekly Duration minutes"
                value={form.minutes}
                max={59}
                onChange={(minutes) => update({ minutes })}
              />
              <span className="text-muted-foreground">m</span>
            </Row>
            <Row label="Warm-up" htmlFor="warm-up">
              <NumberInput
                id="warm-up"
                value={form.warmUp}
                max={99}
                onChange={(warmUp) => update({ warmUp })}
              />
              <span className="w-3 text-muted-foreground">′</span>
            </Row>
            <Row label="Cool-down" htmlFor="cool-down">
              <NumberInput
                id="cool-down"
                value={form.coolDown}
                max={99}
                onChange={(coolDown) => update({ coolDown })}
              />
              <span className="w-3 text-muted-foreground">′</span>
            </Row>
            <FieldErrors errors={errors} fields={['weeklyDuration', 'warmUp', 'coolDown']} />
          </Section>
          <Section title="Paces">
            <Row label="5K Time" htmlFor="five-k-time">
              <Input
                id="five-k-time"
                className="w-16 px-2 text-right font-semibold tabular-nums"
                placeholder="19:45"
                value={form.fiveKTime}
                onChange={(e) => update({ fiveKTime: e.target.value })}
              />
            </Row>
            {paces &&
              REP_LENGTHS.map((repLength) => (
                <Row key={repLength} label={`${repLength} pace`}>
                  <span className="font-semibold tabular-nums">
                    {formatRepPace(paces.rep[repLength])}/km
                  </span>
                </Row>
              ))}
            {paces && (
              <Row label="Easy pace">
                <span className="font-semibold tabular-nums">{formatDuration(paces.easy)}/km</span>
              </Row>
            )}
            <FieldErrors errors={errors} fields={['fiveKTime']} />
          </Section>
          <Section
            title={
              <Explained
                section="day-preferences"
                explanation={`Default leaves the day to the planner. At most ${DAY_PREFERENCE_LIMITS.rest} Rest, ${DAY_PREFERENCE_LIMITS.easy} Easy, ${DAY_PREFERENCE_LIMITS.long} Long and ${DAY_PREFERENCE_LIMITS.subT} SubT days, and SubT days cannot be next to each other.`}
              >
                Day Preferences
              </Explained>
            }
          >
            {WEEKDAYS.map((weekday) => (
              <Row key={weekday} label={<span className="capitalize">{weekday}</span>}>
                <Select
                  value={form.dayPreferences[weekday] ?? 'default'}
                  onValueChange={(value: DayPreference) => {
                    const { [weekday]: _, ...rest } = form.dayPreferences
                    update({
                      dayPreferences: value === 'default' ? rest : { ...rest, [weekday]: value },
                    })
                  }}
                >
                  <SelectTrigger size="sm" aria-label={weekday} className="w-fit font-semibold">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(PREFERENCE_LABELS).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        <span className="inline-flex items-center gap-2">
                          <span
                            className="size-2 rounded-sm border"
                            style={
                              value === 'default'
                                ? undefined
                                : { background: `var(--day-${value})`, borderColor: 'transparent' }
                            }
                          />
                          {label}
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </Row>
            ))}
            <FieldErrors errors={errors} fields={['dayPreferences']} />
          </Section>
        </aside>

        <main className="flex min-w-0 flex-col gap-4 p-4">
          {actionError && <p className="text-destructive">{actionError}</p>}
          {errors.length === 0 ? (
            <WeekView
              settings={settings}
              sessionChoices={sessionChoices}
              paces={paces}
              hasApiKey={loaded.hasApiKey}
              isGuest={!user}
              syncDisabled={!saved || !samePlanSettings(settings, saved)}
              onReshuffle={() => update({ shuffle: randomShuffle() })}
              onChooseSession={chooseSession}
            />
          ) : (
            <p className="text-muted-foreground">
              Your Week appears here once the plan settings are valid.
            </p>
          )}
        </main>
      </div>
    </div>
  )
}

function Section({ title, children }: { title: React.ReactNode; children: React.ReactNode }) {
  return (
    <section className="flex flex-col gap-1">
      <h2 className="mb-0.5 border-b pb-1 text-xs font-bold tracking-wider text-muted-foreground uppercase">
        {title}
      </h2>
      {children}
    </section>
  )
}

function Row({
  label,
  htmlFor,
  children,
}: {
  label: React.ReactNode
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-9 items-center gap-1.5">
      <Label
        htmlFor={htmlFor}
        className="flex-1 font-normal whitespace-nowrap text-muted-foreground"
      >
        {label}
      </Label>
      {children}
    </div>
  )
}

function FieldErrors({
  errors,
  fields,
}: {
  errors: PlanSettingsError[]
  fields: PlanSettingsError['field'][]
}) {
  return errors
    .filter((e) => fields.includes(e.field))
    .map((e) => (
      <p key={e.message} className="text-destructive">
        {e.message}
      </p>
    ))
}

function NumberInput({
  value,
  max,
  onChange,
  ...props
}: Omit<React.ComponentProps<'input'>, 'value' | 'max' | 'onChange'> & {
  value: string
  max: number
  onChange: (value: string) => void
}) {
  return (
    <Input
      className="w-11 px-2 text-right font-semibold tabular-nums"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const next = e.target.value
        if (/^\d*$/.test(next) && (next === '' || Number(next) <= max)) onChange(next)
      }}
      {...props}
    />
  )
}
