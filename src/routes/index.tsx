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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeekView } from '@/components/week-view'
import { authClient } from '@/auth/auth-client'
import { getUser } from '@/auth/auth.functions'
import { getPlanSettings, savePlanSettings } from '@/plan-settings/plan-settings.functions'
import { mondayOf } from '@/lib/week-dates'
import {
  deriveWeek,
  randomShuffle,
  WEEKDAYS,
  type DayPreference,
  type PlanSettings,
} from '@/planner/planner'
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
  loader: () => getPlanSettings(),
  component: Home,
})

interface FormState {
  hours: string
  minutes: string
  warmUp: string
  coolDown: string
  dayPreferences: PlanSettings['dayPreferences']
  shuffle: number
}

const toForm = (s: PlanSettings): FormState => ({
  hours: String(Math.floor(s.weeklyDurationMinutes / 60)),
  minutes: String(s.weeklyDurationMinutes % 60),
  warmUp: String(s.warmUpMinutes),
  coolDown: String(s.coolDownMinutes),
  dayPreferences: s.dayPreferences,
  shuffle: s.shuffle,
})

const parseMinutes = (value: string) => (value === '' ? Number.NaN : Number(value))

const samePlanSettings = (a: PlanSettings, b: PlanSettings) =>
  a.weeklyDurationMinutes === b.weeklyDurationMinutes &&
  a.warmUpMinutes === b.warmUpMinutes &&
  a.coolDownMinutes === b.coolDownMinutes &&
  a.shuffle === b.shuffle &&
  WEEKDAYS.every((d) => a.dayPreferences[d] === b.dayPreferences[d])

const toSettings = (f: FormState): PlanSettings => ({
  weeklyDurationMinutes:
    f.hours === '' && f.minutes === '' ? Number.NaN : Number(f.hours) * 60 + Number(f.minutes),
  warmUpMinutes: parseMinutes(f.warmUp),
  coolDownMinutes: parseMinutes(f.coolDown),
  dayPreferences: f.dayPreferences,
  shuffle: f.shuffle,
})

const PREFERENCE_LABELS: Record<DayPreference, string> = {
  default: 'Default',
  rest: 'Rest',
  easy: 'Easy',
  long: 'Long',
  subT: 'SubT',
}

function Home() {
  const saved = Route.useLoaderData()
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
        },
  )
  const [actionError, setActionError] = useState<string>()
  const [expanded, setExpanded] = useState(!saved)

  const settings = toSettings(form)
  const errors = validatePlanSettings(settings)
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

  const signOut = async () => {
    await authClient.signOut()
    await navigate({ to: '/sign-in' })
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-5 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-extrabold tracking-tight sm:text-3xl">
          NSM Planner <span className="text-primary">•</span>
        </h1>
        <div className="flex items-center gap-3">
          <Link to="/how-it-works" className="font-semibold text-primary hover:underline">
            How this works
          </Link>
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
            <div className="flex items-center gap-2">
              <Button variant="secondary" onClick={() => update({ shuffle: randomShuffle() })}>
                Reshuffle
              </Button>
              <Button
                variant="outline"
                aria-expanded={expanded}
                onClick={() => setExpanded(!expanded)}
              >
                Edit
                <ChevronDownIcon className={expanded ? 'rotate-180' : undefined} />
              </Button>
            </div>
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
            ...(expanded ? [] : errors.map((e) => e.message)),
            ...(actionError ? [actionError] : []),
          ].map((message) => (
            <p key={message} className="-mt-3 text-destructive">
              {message}
            </p>
          ))}
        </CardContent>
      </Card>

      {errors.length === 0 && <Weeks settings={settings} />}
    </main>
  )
}

function Weeks({ settings }: { settings: PlanSettings }) {
  const [today] = useState(() => new Date())
  const weeks = [
    { value: 'current', label: 'This week', monday: mondayOf(today) },
    { value: 'next', label: 'Next week', monday: mondayOf(today, 1) },
  ]
  return (
    <Tabs defaultValue="current" className="gap-5">
      <TabsList>
        {weeks.map((w) => (
          <TabsTrigger key={w.value} value={w.value}>
            {w.label} ({w.monday})
          </TabsTrigger>
        ))}
      </TabsList>
      {weeks.map((w) => (
        <TabsContent key={w.value} value={w.value}>
          <WeekView week={deriveWeek(settings, w.monday)} />
        </TabsContent>
      ))}
    </Tabs>
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
