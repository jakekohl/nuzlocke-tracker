import { describe, it, beforeEach, mock } from 'node:test'
import assert from 'node:assert/strict'
import { hashApiKey, apiKeyPrefix } from '../apiKeyCrypto.js'
import {
  LAST_LOGIN_TOUCH_TTL_SECONDS,
  shouldTouchLastLogin,
  toUserResponse,
} from '../userService.js'

describe('userService key hashing contract', () => {
  it('stores hash and prefix derived from the plaintext key', () => {
    const apiKey = 'nuz_examplekeyvalue1234567890abcd'
    const stored = {
      apiKeyHash: hashApiKey(apiKey),
      apiKeyPrefix: apiKeyPrefix(apiKey),
    }

    assert.equal(stored.apiKeyHash.length, 64)
    assert.equal(stored.apiKeyPrefix, 'nuz_exam')
    assert.notEqual(stored.apiKeyHash, apiKey)
  })
})

describe('createUser response shape (mocked)', () => {
  beforeEach(() => {
    mock.reset()
  })

  it('never puts plaintext key into toUserResponse fields', () => {
    const doc = {
      id: 1,
      name: 'Jake',
      email: 'jake@example.com',
      apiKeyHash: hashApiKey('nuz_secret'),
      apiKeyPrefix: 'nuz_secr',
      created: 1,
      updated: 1,
      lastLogin: 1,
      inactive: false,
      password: 'should-not-leak',
    }

    const response = toUserResponse(doc)
    assert.equal(response.email, 'jake@example.com')
    assert.equal(response.apiKeyPrefix, 'nuz_secr')
    assert.equal('apiKeyHash' in response, false)
    assert.equal('apiKey' in response, false)
    assert.equal('password' in response, false)
  })
})

describe('shouldTouchLastLogin', () => {
  it('uses a 30-minute TTL', () => {
    assert.equal(LAST_LOGIN_TOUCH_TTL_SECONDS, 30 * 60)
  })

  it('returns true when lastLogin is missing', () => {
    assert.equal(shouldTouchLastLogin(1_000_000, undefined), true)
    assert.equal(shouldTouchLastLogin(1_000_000, null), true)
  })

  it('returns false when lastLogin is within the TTL window', () => {
    const now = 1_000_000
    assert.equal(shouldTouchLastLogin(now, now - LAST_LOGIN_TOUCH_TTL_SECONDS + 1), false)
    assert.equal(shouldTouchLastLogin(now, now), false)
  })

  it('returns true when lastLogin is older than the TTL', () => {
    const now = 2_000_000
    assert.equal(shouldTouchLastLogin(now, now - LAST_LOGIN_TOUCH_TTL_SECONDS), true)
    assert.equal(shouldTouchLastLogin(now, now - LAST_LOGIN_TOUCH_TTL_SECONDS - 1), true)
  })
})
