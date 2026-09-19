import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { seedReferenceData } from '../seedService.js'
import { nationalDex } from '../../data/nationalDex.js'
import { allLocations } from '../../data/locations/index.js'

describe('seedReferenceData', () => {
  it('reports static catalog sizes without writing to Mongo', () => {
    const result = seedReferenceData()
    assert.equal(result.source, 'static')
    assert.equal(result.pokemon.total, nationalDex.length)
    assert.equal(result.routes.total, allLocations.length)
    assert.equal(result.pokemon.total, 1025)
    assert.ok(result.routes.total > 200)
    assert.equal(result.pokemon.upserted, undefined)
    assert.equal(result.routes.upserted, undefined)
  })
})
