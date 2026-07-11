import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getPathSegments, getRouteParam } from '../requestParams.js'

describe('getPathSegments', () => {
  it('reads array path from query (Vercel catch-all)', () => {
    assert.deepEqual(
      getPathSegments({ query: { path: ['runs', '3'] }, url: '/api/runs/3' }),
      ['runs', '3'],
    )
  })

  it('reads slash-joined path from query', () => {
    assert.deepEqual(
      getPathSegments({ query: { path: 'auth/me' }, url: '/api/auth/me' }),
      ['auth', 'me'],
    )
  })

  it('falls back to pathname and strips api prefix', () => {
    assert.deepEqual(
      getPathSegments({ query: {}, url: '/api/users/rotate-key' }),
      ['users', 'rotate-key'],
    )
  })
})

describe('getRouteParam', () => {
  it('reads id from query', () => {
    assert.equal(getRouteParam({ query: { id: '42' }, url: '/api/runs/99' }, 'id'), '42')
  })

  it('falls back to pathname when query is missing', () => {
    assert.equal(getRouteParam({ query: {}, url: '/api/runs/3' }, 'id'), '3')
  })

  it('reads id from catch-all path segments', () => {
    assert.equal(
      getRouteParam({ query: { path: ['runs', '7'] }, url: '/api/runs/7' }, 'id'),
      '7',
    )
  })

  it('returns null when id cannot be resolved', () => {
    assert.equal(getRouteParam({ query: {}, url: '/api/runs' }, 'id'), null)
  })
})
