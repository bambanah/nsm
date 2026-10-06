import { addDaysTo } from '@/lib/week-dates'
import { EXTERNAL_ID_PREFIX, type Workout } from './workouts'

const EVENTS_URL = 'https://intervals.icu/api/v1/athlete/0/events'

export async function replaceManagedWorkouts(
  apiKey: string,
  monday: string,
  workouts: Workout[],
  fetchFn: typeof fetch = fetch,
) {
  const request = async (method: string, url: string, body?: unknown) => {
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
