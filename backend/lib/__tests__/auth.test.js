import { describe, it, beforeEach } from 'node:test'
import assert from 'node:assert/strict'
import {
  hashApiKey,
  generateApiKey,
  apiKeyPrefix,
  secretsEqual,
} from '../apiKeyCrypto.js'
import { requireBootstrap, _resetRateLimitState } from '../auth.js'

describe('apiKeyCrypto', () => {
  it('hashes deterministically', () => {
    assert.equal(hashApiKey('nuz_test'), hashApiKey('nuz_test'))
    assert.notEqual(hashApiKey('nuz_a'), hashApiKey('nuz_b'))
  })

  it('generates unique nuz_ prefixed keys', () => {
    const a = generateApiKey()
    const b = generateApiKey()
    assert.match(a, /^nuz_/)
    assert.match(b, /^nuz_/)
    assert.notEqual(a, b)
  })

  it('returns an 8-char prefix', () => {
    assert.equal(apiKeyPrefix('nuz_abcdefgh'), 'nuz_abcd')
  })

  it('compares secrets in constant-ish time', () => {
    assert.equal(secretsEqual('secret', 'secret'), true)
    assert.equal(secretsEqual('secret', 'Secret'), false)
    assert.equal(secretsEqual('', 'secret'), false)
    assert.equal(secretsEqual('ab', 'abc'), false)
  })
})

describe('requireBootstrap', () => {
  beforeEach(() => {
    _resetRateLimitState()
    process.env.BOOTSTRAP_SECRET = 'bootstrap-test-secret'
  })

  function mockRes() {
    return {
      statusCode: null,
      body: null,
      status(code) {
        this.statusCode = code
        return this
      },
      json(data) {
        this.body = data
        return this
      },
    }
  }

  it('accepts a matching bootstrap secret', () => {
    const res = mockRes()
    const ok = requireBootstrap(
      { headers: { 'x-bootstrap-secret': 'bootstrap-test-secret' } },
      res,
    )
    assert.equal(ok, true)
    assert.equal(res.statusCode, null)
  })

  it('rejects a mismatched bootstrap secret', () => {
    const res = mockRes()
    const ok = requireBootstrap(
      { headers: { 'x-bootstrap-secret': 'wrong' } },
      res,
    )
    assert.equal(ok, false)
    assert.equal(res.statusCode, 401)
  })
})
