import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { allLocations } from '../../data/locations/index.js'
import { GAMES, gameIds } from '../games.js'
import { listGamesCatalog, locationCountByGameId } from '../gameCatalog.js'

describe('location checklists', () => {
  it('has unique ids and slugs', () => {
    const ids = new Set(allLocations.map((row) => row.id))
    const slugs = new Set(allLocations.map((row) => row.slug))
    assert.equal(ids.size, allLocations.length)
    assert.equal(slugs.size, allLocations.length)
  })

  it('covers every catalogued mainline game', () => {
    const counts = locationCountByGameId()
    for (const game of GAMES) {
      assert.ok(
        (counts.get(game.id) ?? 0) >= 8,
        `${game.label} (${game.id}) should have location data, got ${counts.get(game.id) ?? 0}`,
      )
    }
  })

  it('keeps original Red/Blue Kanto ids 1–53', () => {
    const kanto = allLocations.filter((row) => row.id >= 1 && row.id <= 53)
    assert.equal(kanto.length, 53)
    assert.ok(kanto.every((row) => row.gameIds.includes(gameIds.red) && row.gameIds.includes(gameIds.blue)))
  })
})

describe('listGamesCatalog', () => {
  it('returns every game with a location count', () => {
    const catalog = listGamesCatalog()
    assert.equal(catalog.length, GAMES.length)
    assert.ok(catalog.every((game) => game.locationCount > 0 && game.label && game.generation >= 1))
    assert.ok(catalog.some((game) => game.slug === 'brilliantdiamond'))
    assert.ok(catalog.some((game) => game.slug === 'shiningpearl'))
  })
})
