import { useState } from 'react'
import { createFileRoute, redirect, useNavigate, useRouter } from '@tanstack/react-router'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { WeekView } from '@/components/week-view'
import { authClient } from '@/auth/auth-client'
import { getUser } from '@/auth/auth.functions'
import {
  getPlanSettings,
  reshuffle,
  savePlanSettings,
} from '@/plan-settings/plan-settings.functions'
import { mondayOf } from '@/lib/week-dates'
import {
  deriveWeek,
  randomShuffle,
  WEEKDAYS,
  type DayPreference,
  type PlanSettings,
} from '@/planner/planner'
import { validatePlanSettings, type PlanSettingsError } from '@/planner/validate'

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

const toSettings = (f: FormState): PlanSettings => ({
  weeklyDurationMinutes:
    f.hours === '' && f.minutes === '' ? Number.NaN : Number(f.hours) * 60 + Number(f.minutes),
  warmUpMinutes: f.warmUp === '' ? Number.NaN : Number(f.warmUp),
  coolDownMinutes: f.coolDown === '' ? Number.NaN : Number(f.coolDown),
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
  const [saveError, setSaveError] = useState<string>()

  const settings = toSettings(form)
  const errors = validatePlanSettings(settings)
  const isDirty = JSON.stringify(settings) !== JSON.stringify(saved)
  const update = (patch: Partial<FormState>) => setForm((f) => ({ ...f, ...patch }))

  const save = async () => {
    setSaveError(undefined)
    try {
      await savePlanSettings({ data: settings })
      await router.invalidate()
    } catch (e) {
      setSaveError((e as Error).message)
    }
  }

  const onReshuffle = async () => {
    if (!saved) return update({ shuffle: randomShuffle() })
    update({ shuffle: await reshuffle() })
    await router.invalidate()
  }

  const signOut = async () => {
    await authClient.signOut()
    await navigate({ to: '/sign-in' })
  }

  return (
    <main className="mx-auto flex max-w-5xl flex-col gap-8 p-4 sm:p-8">
      <header className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold">NSM Planner</h1>
        <div className="flex items-center gap-3 text-sm">
          <span className="text-muted-foreground">{user.name}</span>
          <Button variant="outline" size="sm" onClick={signOut}>
            Sign out
          </Button>
        </div>
      </header>

      <section className="flex flex-col gap-6">
        <h2 className="text-lg font-semibold">Plan Settings</h2>
        <div className="flex flex-wrap gap-6">
          <Field label="Weekly Duration" errors={errors} field="weeklyDuration">
            <div className="flex items-center gap-2">
              <NumberInput
                value={form.hours}
                max={10}
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
            <NumberInput value={form.warmUp} max={99} onChange={(warmUp) => update({ warmUp })} />
          </Field>
          <Field label="Cool-down (min)" errors={errors} field="coolDown">
            <NumberInput
              value={form.coolDown}
              max={99}
              onChange={(coolDown) => update({ coolDown })}
            />
          </Field>
        </div>

        <Field label="Day Preferences" errors={errors} field="dayPreferences">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {WEEKDAYS.map((weekday) => (
              <div key={weekday} className="flex flex-col gap-1">
                <Label className="capitalize">{weekday}</Label>
                <Select
                  value={form.dayPreferences[weekday] ?? 'default'}
                  onValueChange={(value: DayPreference) => {
                    const { [weekday]: _, ...rest } = form.dayPreferences
                    update({
                      dayPreferences: value === 'default' ? rest : { ...rest, [weekday]: value },
                    })
                  }}
                >
                  <SelectTrigger className="w-full">
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

        <div className="flex items-center gap-3">
          <Button onClick={save} disabled={errors.length > 0 || !isDirty}>
            Save
          </Button>
          <Button variant="outline" onClick={onReshuffle}>
            Reshuffle
          </Button>
          {isDirty && saved && (
            <span className="text-muted-foreground text-sm">Unsaved changes</span>
          )}
          {saveError && <span className="text-destructive text-sm">{saveError}</span>}
        </div>
      </section>

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
    <Tabs defaultValue="current">
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
  label: string
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
          <p key={e.message} className="text-destructive text-sm">
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
      className="w-20"
      inputMode="numeric"
      value={value}
      onChange={(e) => {
        const next = e.target.value
        if (/^\d*$/.test(next) && (next === '' || Number(next) <= max)) onChange(next)
      }}
    />
  )
}
