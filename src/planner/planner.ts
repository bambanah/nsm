import { createRandom, type Random } from './random'
import { RECOVERY_MINUTES, REP_FORMATS, workMinutes, type RepFormat } from './rep-formats'

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

export const DAY_PREFERENCES = ['default', 'rest', 'easy', 'long', 'subT'] as const

export type DayPreference = (typeof DAY_PREFERENCES)[number]

export interface PlanSettings {
  weeklyDurationMinutes: number
  warmUpMinutes: number
  coolDownMinutes: number
  dayPreferences: Partial<Record<Weekday, Exclude<DayPreference, 'default'>>>
  shuffle: number
  fiveKSeconds: number | null
}

export interface SubThresholdSession {
  repFormat: RepFormat
  warmUpMinutes: number
  coolDownMinutes: number
  workMinutes: number
  recoveryMinutes: number
  minutes: number
}

export interface SessionChoice {
  weekday: Weekday
  repFormat: RepFormat
}

export type Day = { weekday: Weekday } & (
  | { type: 'subT'; session: SubThresholdSession; plannerRepFormat: RepFormat }
  | { type: 'easy'; minutes: number }
  | { type: 'long'; minutes: number }
  | { type: 'rest'; merged?: true }
)

export interface Week {
  monday: string
  days: Day[]
  totalMinutes: number
  subThresholdWorkMinutes: number
  subThresholdPercent: number
  subThresholdTargetPercent: number
}

export const MIN_WEEKLY_DURATION_MINUTES = 300
export const MAX_WEEKLY_DURATION_MINUTES = 540
export const SUB_THRESHOLD_SESSIONS = 3
export const SESSION_WORK_CAP_MINUTES = 35
export const SESSION_CAP_UNTIL_MINUTES = 420
export const LONG_RUN_RATIO = 1.7
export const MIN_LONG_RUN_MINUTES = 75
export const MAX_LONG_RUN_MINUTES = 105

export const SUB_THRESHOLD_PERCENT = 23
export const MIN_SUB_THRESHOLD_PERCENT = 20
export const TAPER_FROM_MINUTES = 420
export const TOLERANCE = 1.5
const MAX_ATTEMPTS = 30

export function deriveWeek(
  settings: PlanSettings,
  monday: string,
  sessionChoices: SessionChoice[] = [],
): Week {
  const random = createRandom(`${settings.shuffle}:${monday}`)
  const minutes = settings.weeklyDurationMinutes
  let closest: { days: Day[]; distance: number } | undefined

  for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
    const repFormats = selectRepFormats(minutes, random)
    const share = (sum(repFormats.map(workMinutes)) / minutes) * 100
    const distance = Math.abs(share - subThresholdTarget(minutes))
    if (closest && distance >= closest.distance) continue
    const days = planDays(settings, repFormats, sessionChoices, random)
    if (!days) continue
    if (distance <= TOLERANCE) return summarise(settings, monday, days)
    closest = { days, distance }
  }
  if (closest) return summarise(settings, monday, closest.days)
  throw new Error('Could not place the Sub-threshold Sessions on non-adjacent days')
}

export function deadSessionChoices<T extends SessionChoice>(
  settings: PlanSettings,
  monday: string,
  sessionChoices: T[],
): T[] {
  const { days } = deriveWeek(settings, monday)
  return sessionChoices.filter(
    (c) =>
      days.find((d) => d.weekday === c.weekday)?.type !== 'subT' ||
      exceedsSessionCap(c.repFormat, settings.weeklyDurationMinutes),
  )
}

function planDays(
  settings: PlanSettings,
  repFormats: RepFormat[],
  sessionChoices: SessionChoice[],
  random: Random,
): Day[] | undefined {
  const minutes = settings.weeklyDurationMinutes
  const preference = (d: Weekday) => settings.dayPreferences[d] ?? 'default'
  const preferredSubT = daysPreferring(settings, 'subT')
  const defaults = daysPreferring(settings, 'default')

  const need = repFormats.length - preferredSubT.length
  const placed =
    preferredSubT.length > 0
      ? findSpacingWithExisting(defaults, need, preferredSubT, random)
      : findSpacing(defaults, need, random)
  const subTDays = sortWeekdays([...preferredSubT, ...placed])
  if (subTDays.length !== repFormats.length || !isWellSpaced(subTDays)) return

  const sessions = subTDays.map((weekday, i) => {
    const chosen = sessionChoices.find(
      (c) => c.weekday === weekday && !exceedsSessionCap(c.repFormat, minutes),
    )
    return toSession(chosen?.repFormat ?? repFormats[i], settings)
  })

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
  if (!longDay) return

  const easyDays = [
    ...random.shuffle(defaults.filter((d) => !subTDays.includes(d) && d !== longDay)),
    ...daysPreferring(settings, 'easy'),
  ]
  const subTTotal = sum(sessions.map((s) => s.minutes))
  const baseEasyRunMinutes = (minutes - subTTotal) / (easyDays.length + LONG_RUN_RATIO)
  const longMinutes = Math.min(
    Math.max(Math.round(LONG_RUN_RATIO * baseEasyRunMinutes), MIN_LONG_RUN_MINUTES),
    MAX_LONG_RUN_MINUTES,
  )
  const easyMinutes = Math.round((minutes - subTTotal - longMinutes) / easyDays.length)

  const easyRuns = mergeShortEasyRuns(
    easyDays.map((weekday) => ({ weekday, minutes: easyMinutes })),
  )

  return WEEKDAYS.map((weekday): Day => {
    const subTIndex = subTDays.indexOf(weekday)
    if (subTIndex >= 0)
      return {
        weekday,
        type: 'subT',
        session: sessions[subTIndex],
        plannerRepFormat: repFormats[subTIndex],
      }
    if (weekday === longDay) return { weekday, type: 'long', minutes: longMinutes }
    const easyRun = easyRuns.find((r) => r.weekday === weekday)
    if (easyRun) return { weekday, type: 'easy', minutes: easyRun.minutes }
    if (easyDays.includes(weekday)) return { weekday, type: 'rest', merged: true }
    return { weekday, type: 'rest' }
  })
}

export const SHORT_EASY_RUN_MINUTES = 25

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
  const work = workMinutes(repFormat)
  const recovery = RECOVERY_MINUTES[repFormat.repLength]
  return {
    repFormat,
    warmUpMinutes: settings.warmUpMinutes,
    coolDownMinutes: settings.coolDownMinutes,
    workMinutes: work,
    recoveryMinutes: recovery,
    minutes:
      work + (repFormat.reps - 1) * recovery + settings.warmUpMinutes + settings.coolDownMinutes,
  }
}

function summarise(settings: PlanSettings, monday: string, days: Day[]): Week {
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
    subThresholdPercent: oneDecimal((subThresholdWorkMinutes / totalMinutes) * 100),
    subThresholdTargetPercent: oneDecimal(subThresholdTarget(settings.weeklyDurationMinutes)),
  }
}

export function subThresholdTarget(weeklyDurationMinutes: number) {
  if (weeklyDurationMinutes <= TAPER_FROM_MINUTES) return SUB_THRESHOLD_PERCENT
  const progress =
    (weeklyDurationMinutes - TAPER_FROM_MINUTES) /
    (MAX_WEEKLY_DURATION_MINUTES - TAPER_FROM_MINUTES)
  return SUB_THRESHOLD_PERCENT - (SUB_THRESHOLD_PERCENT - MIN_SUB_THRESHOLD_PERCENT) * progress
}

const subThresholdBudget = (weeklyDurationMinutes: number) =>
  Math.round((weeklyDurationMinutes * subThresholdTarget(weeklyDurationMinutes)) / 100)

export const exceedsSessionCap = (repFormat: RepFormat, weeklyDurationMinutes: number) =>
  weeklyDurationMinutes <= SESSION_CAP_UNTIL_MINUTES &&
  workMinutes(repFormat) > SESSION_WORK_CAP_MINUTES

function selectRepFormats(minutes: number, random: Random): RepFormat[] {
  const capped = (repLength: RepFormat['repLength']) =>
    REP_FORMATS.filter((f) => f.repLength === repLength && !exceedsSessionCap(f, minutes))

  const thirtyK = random.pick(capped('30K'))
  const remainder = Math.max(0, subThresholdBudget(minutes) - workMinutes(thirtyK))
  const closest = (target: number, candidates: RepFormat[]) =>
    target > 0
      ? candidates.reduce((best, f) =>
          Math.abs(workMinutes(f) - target) < Math.abs(workMinutes(best) - target) ? f : best,
        )
      : random.pick(candidates)

  return random.shuffle([
    thirtyK,
    closest(Math.round(remainder * 0.5), capped('15K')),
    closest(Math.round(remainder * 0.5), capped('HM')),
  ])
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

export function daysPreferring(settings: PlanSettings, preference: DayPreference) {
  return WEEKDAYS.filter((d) => (settings.dayPreferences[d] ?? 'default') === preference)
}

export function isWellSpaced(days: Weekday[]) {
  const indices = days.map((d) => WEEKDAYS.indexOf(d))
  return indices.every((a) => !indices.some((b) => b - a === 1 || (a === 6 && b === 0)))
}

function sortWeekdays(days: Weekday[]) {
  return [...days].sort((a, b) => WEEKDAYS.indexOf(a) - WEEKDAYS.indexOf(b))
}

const oneDecimal = (value: number) => Math.round(value * 10) / 10

function sum(values: number[]) {
  return values.reduce((a, b) => a + b, 0)
}

export function randomShuffle() {
  return Math.floor(Math.random() * 2 ** 31)
}
