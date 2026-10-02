import { createServerFn } from '@tanstack/react-start'
import { getSession } from './auth.server'

export const getUser = createServerFn({ method: 'GET' }).handler(
  async () => (await getSession())?.user ?? null,
)
