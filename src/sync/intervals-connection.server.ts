import { eq } from 'drizzle-orm'
import { db } from '@/db/db.server'
import { intervalsConnections } from '@/db/schema'
import { decryptApiKey, encryptApiKey } from './api-key-crypto.server'

export async function findApiKey(userId: string) {
  const [row] = await db
    .select({ apiKeyEncrypted: intervalsConnections.apiKeyEncrypted })
    .from(intervalsConnections)
    .where(eq(intervalsConnections.userId, userId))
  if (!row) return null
  try {
    return decryptApiKey(row.apiKeyEncrypted)
  } catch {
    return null
  }
}

export async function hasApiKey(userId: string) {
  const [row] = await db
    .select({ userId: intervalsConnections.userId })
    .from(intervalsConnections)
    .where(eq(intervalsConnections.userId, userId))
  return row !== undefined
}

export async function saveApiKey(userId: string, apiKey: string) {
  const values = { apiKeyEncrypted: encryptApiKey(apiKey), updatedAt: new Date() }
  await db
    .insert(intervalsConnections)
    .values({ userId, ...values })
    .onConflictDoUpdate({ target: intervalsConnections.userId, set: values })
}
