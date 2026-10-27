import { beforeEach, describe, expect, it, vi } from 'vitest'
import { clearGuestPlan, loadGuestPlan, saveGuestPlan, type GuestPlan } from './guest-plan'

const plan: GuestPlan = {
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

describe('Guest plan store', () => {
  it('has no plan until one is saved', () => {
    expect(loadGuestPlan()).toBeNull()
  })

  it('loads the plan it saved', () => {
    saveGuestPlan(plan)
    expect(loadGuestPlan()).toEqual(plan)
  })

  it('has no plan once cleared', () => {
    saveGuestPlan(plan)
    clearGuestPlan()
    expect(loadGuestPlan()).toBeNull()
  })

  it.each(['not json', '{"settings":{"shuffle":"x"},"sessionChoices":[]}'])(
    'treats a stored value of %s as no plan',
    (value) => {
      localStorage.setItem('guestPlan', value)
      expect(loadGuestPlan()).toBeNull()
    },
  )

  it('has no plan when localStorage is unavailable', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => {
        throw new Error('blocked')
      },
    })
    expect(loadGuestPlan()).toBeNull()
  })
})
