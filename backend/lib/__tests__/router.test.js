import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { dispatch } from '../router.js'

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

describe('dispatch', () => {
  it('returns 404 for unknown resource', async () => {
    const res = mockRes()
    await dispatch({ method: 'GET', query: { path: ['nope'] }, headers: {}, url: '/api/nope' }, res)
    assert.equal(res.statusCode, 404)
  })

  it('returns 404 for empty path', async () => {
    const res = mockRes()
    await dispatch({ method: 'GET', query: { path: [] }, headers: {}, url: '/api' }, res)
    assert.equal(res.statusCode, 404)
  })

  it('returns 405 for GET /api/users', async () => {
    const res = mockRes()
    await dispatch({ method: 'GET', query: { path: ['users'] }, headers: {}, url: '/api/users' }, res)
    assert.equal(res.statusCode, 405)
  })

  it('returns 401 for GET /api/auth/me without key', async () => {
    const res = mockRes()
    await dispatch(
      { method: 'GET', query: { path: ['auth', 'me'] }, headers: {}, url: '/api/auth/me' },
      res,
    )
    assert.equal(res.statusCode, 401)
  })

  it('returns 401 for POST /api/runs without key', async () => {
    const res = mockRes()
    await dispatch(
      { method: 'POST', query: { path: ['runs'] }, headers: {}, body: {}, url: '/api/runs' },
      res,
    )
    assert.equal(res.statusCode, 401)
  })

  it('returns 401 for POST /api/users/reset-key without bootstrap secret', async () => {
    const res = mockRes()
    await dispatch(
      {
        method: 'POST',
        query: { path: ['users', 'reset-key'] },
        headers: {},
        body: { email: 'you@example.com' },
        url: '/api/users/reset-key',
      },
      res,
    )
    assert.equal(res.statusCode, 401)
  })
})

