import { addDaysTo, isoDate } from '@/lib/week-dates'
import { EXTERNAL_ID_PREFIX, type Workout } from './workouts'

const EVENTS_URL = 'https://intervals.icu/api/v1/athlete/0/events'

const requester =
  (apiKey: string, fetchFn: typeof fetch) =>
  async (method: string, url: string, body?: unknown) => {
    const response = await fetchFn(url, {
      method,
      headers: {
        Authorization: `Basic ${btoa(`API_KEY:${apiKey}`)}`,
        ...(body === undefined ? {} : { 'Content-Type': 'application/json' }),
      },
      body: body === undefined ? undefined : JSON.stringify(body),
    })
    if (response.status === 401) throw new Error('intervals.icu rejected the API key')
    if (!response.ok)
      throw new Error(`intervals.icu failed (${response.status}): ${await response.text()}`)
    return response
  }

export async function checkApiKey(apiKey: string, fetchFn: typeof fetch = fetch) {
  const today = isoDate(new Date())
  await requester(apiKey, fetchFn)('GET', `${EVENTS_URL}?oldest=${today}&newest=${today}`)
}

export async function replaceManagedWorkouts(
  apiKey: string,
  monday: string,
  workouts: Workout[],
  fetchFn: typeof fetch = fetch,
) {
  const request = requester(apiKey, fetchFn)

  const listed = await request(
    'GET',
    `${EVENTS_URL}?oldest=${monday}&newest=${addDaysTo(monday, 6)}&category=WORKOUT`,
  )
  const events: { id: number; external_id?: string | null }[] = await listed.json()
  const managed = events.filter((e) => e.external_id?.startsWith(EXTERNAL_ID_PREFIX))
  if (managed.length > 0)
    await request(
      'PUT',
      `${EVENTS_URL}/bulk-delete`,
      managed.map(({ id }) => ({ id })),
    )
  await request('POST', `${EVENTS_URL}/bulk`, workouts)
}
