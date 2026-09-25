import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { canEvolveTo, getEvolvesToIds } from '../evolution.js'

describe('getEvolvesToIds', () => {
  it('returns the next stage for a linear line', () => {
    assert.deepEqual(getEvolvesToIds(1), [2])
    assert.deepEqual(getEvolvesToIds(2), [3])
    assert.deepEqual(getEvolvesToIds(3), [])
  })

  it('returns all branches for Eevee', () => {
    const next = getEvolvesToIds(133)
    assert.ok(next.includes(134))
    assert.ok(next.includes(135))
    assert.ok(next.includes(136))
    assert.ok(next.length >= 3)
  })
})

describe('canEvolveTo', () => {
  it('allows vanilla next stages only', () => {
    assert.equal(canEvolveTo(1, 2, { randomEvolutions: false }), true)
    assert.equal(canEvolveTo(1, 3, { randomEvolutions: false }), false)
    assert.equal(canEvolveTo(1, 4, { randomEvolutions: false }), false)
  })

  it('allows any other species when randomEvolutions is on', () => {
    assert.equal(canEvolveTo(1, 25, { randomEvolutions: true, maxGeneration: 1 }), true)
    assert.equal(canEvolveTo(1, 1, { randomEvolutions: true }), false)
  })

  it('rejects targets beyond maxGeneration', () => {
    assert.equal(canEvolveTo(133, 700, { randomEvolutions: true, maxGeneration: 1 }), false)
    assert.equal(canEvolveTo(133, 134, { randomEvolutions: false, maxGeneration: 1 }), true)
  })
})
