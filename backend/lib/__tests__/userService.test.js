import { describe, it, mock, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import { hashApiKey, apiKeyPrefix } from '../apiKeyCrypto.js'

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

  it('never puts plaintext key into toUserResponse fields', async () => {
    const { toUserResponse } = await import('../userService.js')
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
