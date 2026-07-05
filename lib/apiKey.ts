import { randomBytes, createHash } from 'crypto'

const KEY_PREFIX = 'vlk_live_'

export interface GeneratedApiKey {
  key: string
  keyPrefix: string
  hashedKey: string
}

export function generateApiKey(): GeneratedApiKey {
  const raw = randomBytes(24).toString('hex')
  const key = `${KEY_PREFIX}${raw}`
  const keyPrefix = key.slice(0, KEY_PREFIX.length + 6)
  const hashedKey = hashApiKey(key)
  return { key, keyPrefix, hashedKey }
}

export function hashApiKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}

export function isValidApiKeyFormat(key: string): boolean {
  return key.startsWith(KEY_PREFIX) && key.length > KEY_PREFIX.length
}
