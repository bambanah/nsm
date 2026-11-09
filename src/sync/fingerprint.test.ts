import { describe, expect, it } from 'vitest'
import { fingerprint } from './fingerprint'
import type { Workout } from './workouts'

const workout: Workout = {
  category: 'WORKOUT',
  type: 'Run',
  start_date_local: '2026-11-09T00:00:00',
  name: 'Easy',
  description: '- 45m 60-70% HR',
  external_id: 'nsm-2026-11-09',
}

describe('fingerprint', () => {
  it('is the same for the same workouts', () => {
    expect(fingerprint([workout])).toBe(fingerprint([{ ...workout }]))
  })

  it.each(['start_date_local', 'name', 'description', 'external_id'] as const)(
    'changes when %s changes',
    (field) => {
      expect(fingerprint([{ ...workout, [field]: 'changed' }])).not.toBe(fingerprint([workout]))
    },
  )

  it('changes when a workout is added', () => {
    expect(fingerprint([workout, workout])).not.toBe(fingerprint([workout]))
  })
})
