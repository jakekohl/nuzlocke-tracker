import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getRouteParam } from '../requestParams.js'

describe('getRouteParam', () => {
  it('reads id from query', () => {
    assert.equal(getRouteParam({ query: { id: '42' }, url: '/api/runs/99' }, 'id'), '42')
  })

  it('falls back to pathname when query is missing', () => {
    assert.equal(getRouteParam({ query: {}, url: '/api/runs/3' }, 'id'), '3')
  })

  it('returns null when id cannot be resolved', () => {
    assert.equal(getRouteParam({ query: {}, url: '/api/runs' }, 'id'), null)
  })
})
