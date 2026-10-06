import { randomBytes } from 'node:crypto'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { decryptApiKey, encryptApiKey } from './api-key-crypto.server'

describe('API key encryption', () => {
  beforeEach(() => vi.stubEnv('INTERVALS_KEY_SECRET', randomBytes(32).toString('base64')))

  it('round-trips an API key without storing it in plain text', () => {
    const encrypted = encryptApiKey('abc123secret')
    expect(encrypted).not.toContain('abc123secret')
    expect(decryptApiKey(encrypted)).toBe('abc123secret')
  })

  it('encrypts the same key differently each time', () => {
    expect(encryptApiKey('abc')).not.toBe(encryptApiKey('abc'))
  })

  it('rejects a tampered ciphertext', () => {
    const bytes = Buffer.from(encryptApiKey('abc123secret'), 'base64')
    bytes[bytes.length - 1] ^= 1
    expect(() => decryptApiKey(bytes.toString('base64'))).toThrow()
  })

  it('refuses to run without a 32-byte secret', () => {
    vi.stubEnv('INTERVALS_KEY_SECRET', 'short')
    expect(() => encryptApiKey('abc')).toThrow('INTERVALS_KEY_SECRET')
  })
})
