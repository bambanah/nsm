import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const IV_BYTES = 12
const TAG_BYTES = 16

function secret() {
  const key = Buffer.from(process.env.INTERVALS_KEY_SECRET ?? '', 'base64')
  if (key.length !== 32) throw new Error('INTERVALS_KEY_SECRET must be 32 bytes, base64-encoded')
  return key
}

export function encryptApiKey(apiKey: string) {
  const iv = randomBytes(IV_BYTES)
  const cipher = createCipheriv('aes-256-gcm', secret(), iv)
  const ciphertext = Buffer.concat([cipher.update(apiKey, 'utf8'), cipher.final()])
  return Buffer.concat([iv, cipher.getAuthTag(), ciphertext]).toString('base64')
}

export function decryptApiKey(encrypted: string) {
  const bytes = Buffer.from(encrypted, 'base64')
  const decipher = createDecipheriv('aes-256-gcm', secret(), bytes.subarray(0, IV_BYTES))
  decipher.setAuthTag(bytes.subarray(IV_BYTES, IV_BYTES + TAG_BYTES))
  return Buffer.concat([
    decipher.update(bytes.subarray(IV_BYTES + TAG_BYTES)),
    decipher.final(),
  ]).toString('utf8')
}
