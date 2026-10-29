import { describe, expect, it } from 'vitest'
import { deriveWeek, type PlanSettings } from './planner'
import { planningState, withSessionChoice } from './planning-state'
import type { RepFormat } from './rep-formats'

const settings: PlanSettings = {
  weeklyDurationMinutes: 420,
  warmUpMinutes: 10,
  coolDownMinutes: 10,
  dayPreferences: {},
  shuffle: 1,
  fiveKSeconds: null,
}
const threeByTen30K: RepFormat = { repLength: '30K', reps: 3, repMinutes: 10 }
const subTDays = deriveWeek(settings)
  .days.filter((d) => d.type === 'subT')
  .map((d) => d.weekday)

describe('Planning State', () => {
  it('drops a Session Choice once its day stops being a Sub-threshold Session', () => {
    const [subTDay] = subTDays
    const chosen = withSessionChoice(planningState(settings, []), subTDay, threeByTen30K)
    expect(chosen.sessionChoices).toEqual([{ weekday: subTDay, repFormat: threeByTen30K }])
    const moved = planningState(
      { ...settings, dayPreferences: { [subTDay]: 'rest' } },
      chosen.sessionChoices,
    )
    expect(planningState(settings, moved.sessionChoices).sessionChoices).toEqual([])
  })

  it('rejects a Session Choice that does not fit its day', () => {
    const otherDay = deriveWeek(settings).days.find((d) => d.type !== 'subT')!.weekday
    expect(() => withSessionChoice(planningState(settings, []), otherDay, threeByTen30K)).toThrow(
      'That Rep Format does not fit this day',
    )
  })
})
