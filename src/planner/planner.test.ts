import { describe, expect, it } from 'vitest'
import { deriveWeek, WEEKDAYS, type DayPreference, type PlanSettings, type Week } from './planner'
import { createRandom } from './random'
import { validatePlanSettings } from './validate'

const settings = (overrides: Partial<PlanSettings> = {}): PlanSettings => ({
  weeklyDurationMinutes: 360,
  warmUpMinutes: 10,
  coolDownMinutes: 10,
  dayPreferences: {},
  shuffle: 1,
  fiveKSeconds: null,
  ...overrides,
})

const mondays = ['2026-09-28', '2026-10-05', '2027-01-04', '2027-06-14']

const everyWeek = (base: Partial<PlanSettings>, check: (week: Week, s: PlanSettings) => void) => {
  for (let shuffle = 0; shuffle < 40; shuffle++)
    for (const monday of mondays) {
      const s = settings({ ...base, shuffle })
      check(deriveWeek(s, monday), s)
    }
}

const subTDays = (week: Week) => week.days.flatMap((d) => (d.type === 'subT' ? [d] : []))

describe('deriveWeek', () => {
  it('places 3 Sub-threshold Sessions on Tue/Thu/Sat, the Long Run on Sunday and equal Easy Runs at 6h all Default', () => {
    const week = deriveWeek(settings(), '2026-09-28')
    expect(week.days.map((d) => d.type)).toEqual([
      'easy',
      'subT',
      'easy',
      'subT',
      'easy',
      'subT',
      'long',
    ])
    const sunday = week.days[6]
    expect(sunday.type === 'long' && sunday.minutes).toBe(75)
    const easyMinutes = week.days.flatMap((d) => (d.type === 'easy' ? [d.minutes] : []))
    expect(new Set(easyMinutes).size).toBe(1)
  })
  it('merges short Easy Runs into a flagged Rest Day at 5h all Default with 15 min warm-up and cool-down', () => {
    everyWeek({ weeklyDurationMinutes: 300, warmUpMinutes: 15, coolDownMinutes: 15 }, (week) => {
      const byType = (t: string) => week.days.filter((d) => d.type === t)
      expect(byType('subT').map((d) => d.weekday)).toEqual(['tuesday', 'thursday', 'saturday'])
      expect(byType('long').map((d) => d.weekday)).toEqual(['sunday'])
      expect(byType('easy')).toHaveLength(2)
      expect(byType('rest')).toEqual([expect.objectContaining({ merged: true })])
    })
  })

  it('leaves requested Rest Days unflagged', () => {
    everyWeek({ dayPreferences: { monday: 'rest' } }, (week) =>
      expect(week.days[0]).toEqual({ weekday: 'monday', type: 'rest' }),
    )
  })

  it.each([300, 301, 420, 540])('plans %i min with 3 Sub-threshold Sessions', (minutes) => {
    everyWeek({ weeklyDurationMinutes: minutes }, (week) => expect(subTDays(week)).toHaveLength(3))
  })

  it.each([300, 420])('caps each session at %i min to 35 work minutes', (minutes) => {
    const work = new Set<number>()
    everyWeek({ weeklyDurationMinutes: minutes }, (week) =>
      subTDays(week).forEach((d) => work.add(d.session.workMinutes)),
    )
    expect(Math.max(...work)).toBeLessThanOrEqual(35)
    expect(Math.max(...work)).toBeGreaterThan(25)
  })

  it('uses Rep Formats over 35 work minutes above 7h', () => {
    const work = new Set<number>()
    everyWeek({ weeklyDurationMinutes: 540 }, (week) =>
      subTDays(week).forEach((d) => work.add(d.session.workMinutes)),
    )
    expect(Math.max(...work)).toBeGreaterThan(35)
  })

  it.each([
    [300, 75],
    [360, 75],
    [540, 105],
  ])('makes the Long Run at %i min last %i min', (minutes, longMinutes) => {
    everyWeek({ weeklyDurationMinutes: minutes }, (week) =>
      expect(week.days.find((d) => d.type === 'long')).toMatchObject({
        minutes: longMinutes,
      }),
    )
  })

  it('makes the Long Run about 1.7 times an Easy Run between the bounds', () => {
    everyWeek({ weeklyDurationMinutes: 420 }, (week) => {
      const long = week.days.find((d) => d.type === 'long')!
      const easy = week.days.find((d) => d.type === 'easy')!
      if (long.type !== 'long' || easy.type !== 'easy') throw new Error('missing runs')
      expect(long.minutes).toBeGreaterThan(75)
      expect(long.minutes).toBeLessThan(105)
      expect(Math.abs(long.minutes - 1.7 * easy.minutes)).toBeLessThanOrEqual(2)
    })
  })

  it('totals a Sub-threshold Session as work, Recoveries between reps by Rep Length, warm-up and cool-down', () => {
    const recovery = { '15K': 1, HM: 1, '30K': 2 }
    everyWeek({ warmUpMinutes: 15, coolDownMinutes: 5 }, (week) => {
      for (const { session } of subTDays(week)) {
        const { reps, repMinutes, repLength } = session.repFormat
        expect(session.workMinutes).toBe(reps * repMinutes)
        expect(session.recoveryMinutes).toBe(recovery[repLength])
        expect(session.minutes).toBe(reps * repMinutes + (reps - 1) * recovery[repLength] + 20)
        expect(session).toMatchObject({ warmUpMinutes: 15, coolDownMinutes: 5 })
      }
    })
  })

  it('summarises total minutes over non-rest days, allowing for rounding', () => {
    everyWeek({ weeklyDurationMinutes: 300 }, (week) => {
      const minutes = week.days.map((d) =>
        d.type === 'subT' ? d.session.minutes : d.type === 'rest' ? 0 : d.minutes,
      )
      const total = minutes.reduce((a, b) => a + b)
      expect(week.totalMinutes).toBe(total)
      expect(Math.abs(total - 300)).toBeLessThanOrEqual(2)
    })
  })

  it.each([
    [300, 23],
    [360, 23],
    [420, 23],
    [480, 21.5],
    [540, 20],
  ])(
    'keeps the Sub-threshold Share at %i min within 1.5 points of %s%, to one decimal',
    (minutes, target) => {
      everyWeek({ weeklyDurationMinutes: minutes }, (week) => {
        expect(week.subThresholdTargetPercent).toBe(target)
        expect(Math.abs(week.subThresholdPercent - target)).toBeLessThanOrEqual(1.6)
        expect(week.subThresholdPercent.toString()).toMatch(/^\d+(\.\d)?$/)
      })
    },
  )

  it('derives the same Week for the same Shuffle and Monday', () => {
    const s = settings({ shuffle: 123456 })
    expect(deriveWeek(s, '2026-10-05')).toEqual(deriveWeek(s, '2026-10-05'))
  })

  const repFormats = (week: Week) => JSON.stringify(subTDays(week).map((d) => d.session.repFormat))

  it('varies Rep Formats from Week to Week and between Shuffles', () => {
    const byDate = new Set(mondays.map((m) => repFormats(deriveWeek(settings(), m))))
    expect(byDate.size).toBeGreaterThan(1)
    const byShuffle = new Set(
      [1, 2, 3, 4].map((shuffle) => repFormats(deriveWeek(settings({ shuffle }), '2026-09-28'))),
    )
    expect(byShuffle.size).toBeGreaterThan(1)
  })
  it('honours Rest, SubT and Long preferences and fills the other Sub-threshold Sessions from non-adjacent Default days', () => {
    const placements = new Set<string>()
    everyWeek(
      {
        weeklyDurationMinutes: 480,
        dayPreferences: { monday: 'rest', tuesday: 'subT', saturday: 'long' },
      },
      (week) => {
        const t = week.days.map((d) => d.type)
        expect(t[0]).toBe('rest')
        expect(t[1]).toBe('subT')
        expect(t[5]).toBe('long')
        expect(t.filter((x) => x === 'subT')).toHaveLength(3)
        placements.add(t.join())
      },
    )
    // Tue plus two of Wed/Thu/Fri/Sun with no adjacent pair: Thu+Sun or Fri+Sun.
    expect(placements).toEqual(
      new Set(['rest,subT,easy,subT,easy,long,subT', 'rest,subT,easy,easy,subT,long,subT']),
    )
  })
  it('never puts the Long Run on an Easy-preferred day', () => {
    const longDays = new Set<string>()
    everyWeek({ weeklyDurationMinutes: 540, dayPreferences: { sunday: 'easy' } }, (week) => {
      expect(week.days[6].type).toBe('easy')
      longDays.add(week.days.find((d) => d.type === 'long')!.weekday)
    })
    expect(longDays).toEqual(new Set(['monday', 'wednesday', 'friday']))
  })

  it('merges Default Easy Runs into Rest Days before Easy-preferred ones', () => {
    everyWeek({ weeklyDurationMinutes: 300, dayPreferences: { friday: 'easy' } }, (week) =>
      expect(week.days[4].type).toBe('easy'),
    )
  })
  it('derives a Week honouring every valid combination of Day Preferences', () => {
    const random = createRandom('preferences')
    const choices: DayPreference[] = ['default', 'default', 'rest', 'easy', 'long', 'subT']
    let valid = 0
    for (let i = 0; i < 3000; i++) {
      const s = settings({
        weeklyDurationMinutes: random.pick([300, 301, 360, 420, 421, 480, 540]),
        dayPreferences: Object.fromEntries(
          WEEKDAYS.map((d) => [d, random.pick(choices)]).filter(([, p]) => p !== 'default'),
        ),
        shuffle: i,
      })
      if (validatePlanSettings(s).length > 0) continue
      valid++
      const week = deriveWeek(s, random.pick(mondays))
      const subT = week.days.flatMap((d, i) => (d.type === 'subT' ? [i] : []))
      expect(subT.some((i) => subT.includes((i + 1) % 7))).toBe(false)
      for (const d of week.days) {
        const preference = s.dayPreferences[d.weekday]
        if (preference === 'rest') expect(d.type).toBe('rest')
        if (preference === 'subT') expect(d.type).toBe('subT')
        if (preference === 'long') expect(d.type).toBe('long')
        if (preference === 'easy') expect(['easy', 'rest']).toContain(d.type)
      }
      expect(week.days.filter((d) => d.type === 'long')).toHaveLength(1)
    }
    expect(valid).toBeGreaterThan(500)
  })
})
