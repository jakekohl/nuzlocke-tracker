import { findUserByApiKey, touchLastLogin } from './userService.js'
import { apiKeyPrefix, secretsEqual } from './apiKeyCrypto.js'

const RATE_LIMIT_WINDOW_MS = 60_000
const RATE_LIMIT_MAX_FAILURES = 20

/** @type {Map<string, { count: number, resetAt: number }>} */
const failedAuthAttempts = new Map()

function getClientKey(req) {
  const forwarded = req.headers['x-forwarded-for']
  const ip = typeof forwarded === 'string' ? forwarded.split(',')[0].trim() : req.socket?.remoteAddress || 'unknown'
  const rawKey = req.headers['x-api-key']
  const prefix = rawKey ? apiKeyPrefix(rawKey) : 'none'
  return `${ip}:${prefix}`
}

function isRateLimited(req) {
  const key = getClientKey(req)
  const now = Date.now()
  const entry = failedAuthAttempts.get(key)

  if (!entry || entry.resetAt <= now) {
    failedAuthAttempts.set(key, { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return false
  }

  return entry.count >= RATE_LIMIT_MAX_FAILURES
}

function recordFailedAuth(req) {
  const key = getClientKey(req)
  const now = Date.now()
  const entry = failedAuthAttempts.get(key)

  if (!entry || entry.resetAt <= now) {
    failedAuthAttempts.set(key, { count: 1, resetAt: now + RATE_LIMIT_WINDOW_MS })
    return
  }

  entry.count += 1
}

function clearFailedAuth(req) {
  failedAuthAttempts.delete(getClientKey(req))
}

/** Exposed for unit tests. */
export function _resetRateLimitState() {
  failedAuthAttempts.clear()
}

function readHeader(req, name) {
  const value = req.headers[name] ?? req.headers[name.toLowerCase()]
  if (Array.isArray(value)) return value[0]
  return value == null ? '' : String(value)
}

/**
 * @returns {Promise<object | null>} user doc response, or null if response already sent
 */
export async function requireUser(req, res) {
  if (isRateLimited(req)) {
    res.status(429).json({ message: 'Too many failed auth attempts. Try again later.' })
    return null
  }

  const rawKey = readHeader(req, 'x-api-key').trim()
  if (!rawKey) {
    recordFailedAuth(req)
    res.status(401).json({ message: 'Unauthorized' })
    return null
  }

  const user = await findUserByApiKey(rawKey)
  if (!user || user.inactive) {
    recordFailedAuth(req)
    res.status(401).json({ message: 'Unauthorized' })
    return null
  }

  clearFailedAuth(req)
  await touchLastLogin(user.id)
  req.user = user
  return user
}

/**
 * @returns {boolean} true if bootstrap authorized; otherwise response already sent
 */
export function requireBootstrap(req, res) {
  if (isRateLimited(req)) {
    res.status(429).json({ message: 'Too many failed auth attempts. Try again later.' })
    return false
  }

  const provided = readHeader(req, 'x-bootstrap-secret').trim()
  const expected = process.env.BOOTSTRAP_SECRET?.trim() ?? ''

  if (!secretsEqual(provided, expected)) {
    recordFailedAuth(req)
    res.status(401).json({ message: 'Unauthorized' })
    return false
  }

  clearFailedAuth(req)
  return true
}

export { hashApiKey, generateApiKey, apiKeyPrefix, secretsEqual } from './apiKeyCrypto.js'
