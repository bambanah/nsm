import { createRandom, type Random } from './random'
import { REP_FORMATS, type RepFormat } from './rep-formats'

export const WEEKDAYS = [
  'monday',
  'tuesday',
  'wednesday',
  'thursday',
  'friday',
  'saturday',
  'sunday',
] as const

export type Weekday = (typeof WEEKDAYS)[number]

export type DayPreference = 'default' | 'rest' | 'easy' | 'long' | 'subT'

export interface PlanSettings {
  weeklyDurationMinutes: number
  warmUpMinutes: number
  coolDownMinutes: number
  dayPreferences: Partial<Record<Weekday, Exclude<DayPreference, 'default'>>>
  shuffle: number
}

export interface SubThresholdSession {
  repFormat: RepFormat
  warmUpMinutes: number
  coolDownMinutes: number
  workMinutes: number
  minutes: number
}

export type Day = { weekday: Weekday } & (
  | { type: 'subT'; session: SubThresholdSession }
  | { type: 'easy' | 'long'; minutes: number }
  | { type: 'rest' }
)

export interface Week {
  monday: string
  days: Day[]
  totalMinutes: number
  subThresholdWorkMinutes: number
  subThresholdPercent: number
}

const SUB_THRESHOLD_PERCENT = 23
const TOLERANCE = 1.5
const MAX_ATTEMPTS = 30

export function deriveWeek(settings: PlanSettings, monday: string): Week {
  const random = createRandom(`${settings.shuffle}:${monday}`)
  const minutes = settings.weeklyDurationMinutes
  const preference = (d: Weekday) => settings.dayPreferences[d] ?? 'default'
  const daysPreferring = (p: DayPreference) => WEEKDAYS.filter((d) => preference(d) === p)
  const preferredSubT = daysPreferring('subT')
  const defaults = daysPreferring('default')

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const repFormats = selectRepFormats(minutes, random)
    const work = sum(repFormats.map((f) => f.reps * f.repMinutes))
    const share = (work / minutes) * 100
    if (Math.abs(share - SUB_THRESHOLD_PERCENT) > TOLERANCE && attempt < MAX_ATTEMPTS) continue

    const sessions = repFormats.map((repFormat) => toSession(repFormat, settings))
    const need = sessions.length - preferredSubT.length
    const placed =
      preferredSubT.length > 0
        ? findSpacingWithExisting(defaults, need, preferredSubT, random)
        : findSpacing(defaults, need, random)
    const subTDays = sortWeekdays([...preferredSubT, ...placed])
    if (subTDays.length !== sessions.length || !isWellSpaced(subTDays)) continue

    const longCandidates = WEEKDAYS.filter(
      (d) => !subTDays.includes(d) && (preference(d) === 'default' || preference(d) === 'long'),
    )
    const preferredLong = WEEKDAYS.find((d) => preference(d) === 'long')
    const longDay = preferredLong
      ? preferredLong
      : longCandidates.includes('sunday')
        ? 'sunday'
        : longCandidates.includes('saturday')
          ? 'saturday'
          : random.pick(longCandidates)
    if (!longDay) continue
    const longMinutes = Math.min(Math.max(Math.round(minutes * 0.25), 75), 135)

    const easyDays = [
      ...random.shuffle(defaults.filter((d) => !subTDays.includes(d) && d !== longDay)),
      ...daysPreferring('easy'),
    ]
    const subTTotal = sum(sessions.map((s) => s.minutes))
    const easyMinutes = Math.round((minutes - subTTotal - longMinutes) / easyDays.length)

    const easyRuns = mergeShortEasyRuns(
      easyDays.map((weekday) => ({ weekday, minutes: easyMinutes })),
    )

    const days = WEEKDAYS.map((weekday): Day => {
      const subTIndex = subTDays.indexOf(weekday)
      if (subTIndex >= 0) return { weekday, type: 'subT', session: sessions[subTIndex] }
      if (weekday === longDay) return { weekday, type: 'long', minutes: longMinutes }
      const easyRun = easyRuns.find((r) => r.weekday === weekday)
      if (easyRun) return { weekday, type: 'easy', minutes: easyRun.minutes }
      return { weekday, type: 'rest' }
    })
    return summarise(monday, days)
  }
  throw new Error('Could not place the Sub-threshold Sessions on non-adjacent days')
}

const SHORT_EASY_RUN_MINUTES = 25

// Each pass merges the shortest short Easy Run into the next shortest, in order.
function mergeShortEasyRuns(runs: { weekday: Weekday; minutes: number }[]) {
  let remaining = runs
  for (;;) {
    const short = remaining
      .toSorted((a, b) => a.minutes - b.minutes)
      .filter((r) => r.minutes <= SHORT_EASY_RUN_MINUTES)
    if (short.length < 2) return remaining
    const [from, into] = short
    remaining = remaining
      .filter((r) => r !== from)
      .map((r) => (r === into ? { ...r, minutes: r.minutes + from.minutes } : r))
  }
}

function toSession(repFormat: RepFormat, settings: PlanSettings): SubThresholdSession {
  const workMinutes = repFormat.reps * repFormat.repMinutes
  return {
    repFormat,
    warmUpMinutes: settings.warmUpMinutes,
    coolDownMinutes: settings.coolDownMinutes,
    workMinutes,
    minutes: workMinutes + repFormat.reps - 1 + settings.warmUpMinutes + settings.coolDownMinutes,
  }
}

function summarise(monday: string, days: Day[]): Week {
  const totalMinutes = sum(
    days.map((d) => (d.type === 'subT' ? d.session.minutes : d.type === 'rest' ? 0 : d.minutes)),
  )
  const subThresholdWorkMinutes = sum(
    days.map((d) => (d.type === 'subT' ? d.session.workMinutes : 0)),
  )
  return {
    monday,
    days,
    totalMinutes,
    subThresholdWorkMinutes,
    subThresholdPercent: Math.round((subThresholdWorkMinutes / totalMinutes) * 1000) / 10,
  }
}

export function sessionCount(weeklyDurationMinutes: number) {
  return Math.round((weeklyDurationMinutes * SUB_THRESHOLD_PERCENT) / 100) < 60 ? 2 : 3
}

function selectRepFormats(minutes: number, random: Random): RepFormat[] {
  const budget = Math.round((minutes * SUB_THRESHOLD_PERCENT) / 100)
  const hours = minutes / 60
  const cap = hours <= 5 ? 25 : hours <= 7 ? 35 : Infinity
  const capped = (repLength: RepFormat['repLength']) =>
    REP_FORMATS.filter((f) => f.repLength === repLength && f.reps * f.repMinutes <= cap)
  const short = capped('15K')
  const medium = capped('HM')

  const long = random.pick(capped('30K'))
  const remainder = Math.max(0, budget - long.reps * long.repMinutes)
  const closest = (target: number, candidates: RepFormat[]) =>
    target > 0
      ? candidates.reduce((best, f) =>
          Math.abs(f.reps * f.repMinutes - target) < Math.abs(best.reps * best.repMinutes - target)
            ? f
            : best,
        )
      : random.pick(candidates)

  const selected =
    sessionCount(minutes) === 2
      ? [long, closest(remainder, [...short, ...medium])]
      : [
          long,
          closest(Math.round(remainder * 0.5), short),
          closest(Math.round(remainder * 0.5), medium),
        ]
  return random.shuffle(selected)
}

function findSpacing(candidates: Weekday[], count: number, random: Random): Weekday[] {
  const preferred = (['tuesday', 'thursday', 'saturday'] as const).filter((d) =>
    candidates.includes(d),
  )
  if (preferred.length >= count) return preferred.slice(0, count)
  for (let i = 0; i < 50; i++) {
    const days = random.shuffle(candidates).slice(0, count)
    if (isWellSpaced(days)) return sortWeekdays(days)
  }
  return maxSpacing(candidates, count)
}

function findSpacingWithExisting(
  candidates: Weekday[],
  count: number,
  existing: Weekday[],
  random: Random,
): Weekday[] {
  return (
    random
      .shuffle(combinations(candidates, count))
      .find((days) => isWellSpaced([...days, ...existing])) ?? []
  )
}

export function combinations<T>(items: T[], count: number): T[][] {
  if (count === 0) return [[]]
  return items.flatMap((item, i) =>
    combinations(items.slice(i + 1), count - 1).map((rest) => [item, ...rest]),
  )
}

function maxSpacing(candidates: Weekday[], count: number): Weekday[] {
  const indices = candidates.map((d) => WEEKDAYS.indexOf(d)).sort((a, b) => a - b)
  const step = Math.floor(indices.length / count)
  const chosen = [indices[0]]
  let position = 0
  for (let i = 1; i < count; i++) {
    position = Math.min(position + step, indices.length - 1)
    chosen.push(indices[position])
  }
  const unique = [...new Set(chosen)]
  for (const index of indices) {
    if (unique.length >= count) break
    if (!unique.includes(index)) unique.push(index)
  }
  return unique.sort((a, b) => a - b).map((i) => WEEKDAYS[i])
}

export function isWellSpaced(days: Weekday[]) {
  const indices = days.map((d) => WEEKDAYS.indexOf(d))
  return indices.every((a) => !indices.some((b) => b - a === 1 || (a === 6 && b === 0)))
}

function sortWeekdays(days: Weekday[]) {
  return [...days].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))
}

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}
