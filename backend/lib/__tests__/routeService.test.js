import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getRouteById, listRoutes } from '../routeService.js'
import { gameIds } from '../games.js'

describe('listRoutes', () => {
  it('filters by game, region, and encounter type', () => {
    const red = listRoutes({ gameId: gameIds.red })
    assert.ok(red.length >= 40)
    assert.ok(red.every((row) => row.gameIds.includes(gameIds.red)))
    assert.ok(red.every((row, i, rows) => i === 0 || rows[i - 1].sortOrder <= row.sortOrder))

    const kantoWild = listRoutes({
      gameId: gameIds.red,
      region: 'kanto',
      encounterType: 'wild',
    })
    assert.ok(kantoWild.length > 0)
    assert.ok(kantoWild.every((row) => row.region === 'kanto' && row.encounterType === 'wild'))
  })
})

describe('getRouteById', () => {
  it('returns a location by id', () => {
    const route1 = getRouteById(1)
    assert.ok(route1)
    assert.equal(typeof route1.slug, 'string')
    assert.ok(route1.gameIds.includes(gameIds.red))
  })

  it('returns null for unknown ids', () => {
    assert.equal(getRouteById(999999), null)
  })
})
