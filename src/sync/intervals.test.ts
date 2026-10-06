import { describe, expect, it } from 'vitest'
import { replaceManagedWorkouts } from './intervals.server'
import type { Workout } from './workouts'

const workout: Workout = {
  category: 'WORKOUT',
  type: 'Run',
  start_date_local: '2026-10-27T00:00:00',
  name: 'Easy',
  description: '- 45m',
  external_id: 'nsm-2026-10-27',
}

function fakeFetch(respond: (url: string, init: RequestInit) => Response) {
  const calls: { method: string; url: string; body?: unknown; auth: string | null }[] = []
  const fetch = async (input: string | URL | Request, init: RequestInit = {}) => {
    const url = String(input)
    calls.push({
      method: init.method ?? 'GET',
      url,
      body: init.body ? JSON.parse(String(init.body)) : undefined,
      auth: new Headers(init.headers).get('Authorization'),
    })
    return respond(url, init)
  }
  return { fetch, calls }
}

const events = [
  { id: 1, external_id: 'nsm-2026-10-26' },
  { id: 2, external_id: null },
  { id: 3, external_id: 'other-app' },
  { id: 4, external_id: 'nsm-2026-11-01' },
]

describe('replaceManagedWorkouts', () => {
  it('lists the calendar week, deletes only Managed Workouts by id, then creates the new ones', async () => {
    const { fetch, calls } = fakeFetch((url) =>
      Response.json(url.includes('oldest=') ? events : []),
    )
    await replaceManagedWorkouts('key', '2026-10-26', [workout], fetch)
    const base = 'https://intervals.icu/api/v1/athlete/0/events'
    expect(calls).toEqual([
      {
        method: 'GET',
        url: `${base}?oldest=2026-10-26&newest=2026-11-01&category=WORKOUT`,
        body: undefined,
        auth: `Basic ${btoa('API_KEY:key')}`,
      },
      {
        method: 'PUT',
        url: `${base}/bulk-delete`,
        body: [{ id: 1 }, { id: 4 }],
        auth: `Basic ${btoa('API_KEY:key')}`,
      },
      {
        method: 'POST',
        url: `${base}/bulk`,
        body: [workout],
        auth: `Basic ${btoa('API_KEY:key')}`,
      },
    ])
  })

  it('skips the delete when the week has no Managed Workouts', async () => {
    const { fetch, calls } = fakeFetch(() => Response.json([]))
    await replaceManagedWorkouts('key', '2026-10-26', [workout], fetch)
    expect(calls.map((c) => c.method)).toEqual(['GET', 'POST'])
  })

  it('reports a rejected API key', async () => {
    const { fetch } = fakeFetch(() => new Response('Unauthorized', { status: 401 }))
    await expect(replaceManagedWorkouts('bad', '2026-10-26', [workout], fetch)).rejects.toThrow(
      'intervals.icu rejected the API key',
    )
  })

  it('reports any other failure with its status and message', async () => {
    const { fetch, calls } = fakeFetch((url) =>
      url.endsWith('/bulk')
        ? new Response('Invalid workout', { status: 422 })
        : Response.json(events),
    )
    await expect(replaceManagedWorkouts('key', '2026-10-26', [workout], fetch)).rejects.toThrow(
      'intervals.icu failed (422): Invalid workout',
    )
    expect(calls).toHaveLength(3)
  })
})
