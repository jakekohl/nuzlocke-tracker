import { createHash, randomBytes, timingSafeEqual } from 'node:crypto'

export function hashApiKey(rawKey) {
  return createHash('sha256').update(String(rawKey), 'utf8').digest('hex')
}

export function generateApiKey() {
  return `nuz_${randomBytes(32).toString('base64url')}`
}

export function apiKeyPrefix(rawKey) {
  return String(rawKey).slice(0, 8)
}

export function secretsEqual(provided, expected) {
  if (!provided || !expected) return false
  const a = Buffer.from(String(provided), 'utf8')
  const b = Buffer.from(String(expected), 'utf8')
  if (a.length !== b.length) return false
  return timingSafeEqual(a, b)
}
