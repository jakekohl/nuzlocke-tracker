import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { kantoRedBlueRoutes } from '../../data/kantoRedBlueRoutes.js'

describe('kantoRedBlueRoutes seed data', () => {
  it('includes Red/Blue Kanto routes with unique ids and slugs', () => {
    assert.ok(kantoRedBlueRoutes.length >= 40)
    const ids = new Set(kantoRedBlueRoutes.map((r) => r.id))
    const slugs = new Set(kantoRedBlueRoutes.map((r) => r.slug))
    assert.equal(ids.size, kantoRedBlueRoutes.length)
    assert.equal(slugs.size, kantoRedBlueRoutes.length)
    assert.ok(kantoRedBlueRoutes.every((r) => r.gameIds.includes(1) && r.gameIds.includes(2)))
  })
})
