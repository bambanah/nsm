import { beforeEach, describe, expect, it, vi } from 'vitest'
import type { PlanningState } from '@/planner/planning-state'
import {
  clearGuestPlanningState,
  loadGuestPlanningState,
  saveGuestPlanningState,
} from './guest-plan'

const state: PlanningState = {
  settings: {
    weeklyDurationMinutes: 360,
    warmUpMinutes: 10,
    coolDownMinutes: 10,
    dayPreferences: { monday: 'rest' },
    shuffle: 1,
    fiveKSeconds: 1185,
  },
  sessionChoices: [
    { weekday: 'tuesday', repFormat: { repLength: '30K', reps: 3, repMinutes: 10 } },
  ],
}

beforeEach(() => {
  const items = new Map<string, string>()
  vi.stubGlobal('localStorage', {
    getItem: (key: string) => items.get(key) ?? null,
    setItem: (key: string, value: string) => items.set(key, value),
    removeItem: (key: string) => items.delete(key),
  })
})

describe('Guest Planning State store', () => {
  it('has no Planning State until one is saved', () => {
    expect(loadGuestPlanningState()).toBeNull()
  })

  it('loads the Planning State it saved', () => {
    saveGuestPlanningState(state)
    expect(loadGuestPlanningState()).toEqual(state)
  })

  it('has no Planning State once cleared', () => {
    saveGuestPlanningState(state)
    clearGuestPlanningState()
    expect(loadGuestPlanningState()).toBeNull()
  })

  it.each(['not json', '{"settings":{"shuffle":"x"},"sessionChoices":[]}'])(
    'treats a stored value of %s as no Planning State',
    (value) => {
      localStorage.setItem('guestPlan', value)
      expect(loadGuestPlanningState()).toBeNull()
    },
  )

  it('has no Planning State when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadGuestPlanningState()).toBeNull()
  })
})
