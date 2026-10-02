import { betterAuth } from 'better-auth'
import { drizzleAdapter } from '@better-auth/drizzle-adapter'
import { tanstackStartCookies } from 'better-auth/tanstack-start'
import { getRequestHeaders } from '@tanstack/react-start/server'
import { db } from '@/db/db.server'

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  emailAndPassword: { enabled: true },
  plugins: [tanstackStartCookies()],
})

export function getSession() {
  return auth.api.getSession({ headers: getRequestHeaders() })
}

export async function requireUserId() {
  const session = await getSession()
  if (!session) throw new Error('Not signed in')
  return session.user.id
}
