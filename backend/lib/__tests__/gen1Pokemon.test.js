import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { gen1Pokemon } from '../../data/gen1Pokemon.js'

describe('gen1Pokemon seed data', () => {
  it('includes all 151 Gen 1 Pokémon with generations and families', () => {
    assert.equal(gen1Pokemon.length, 151)
    assert.equal(gen1Pokemon[0].id, 1)
    assert.equal(gen1Pokemon[150].id, 151)
    assert.equal(gen1Pokemon[5].name, 'Charizard')
    assert.deepEqual(gen1Pokemon[5].types, ['fire', 'flying'])
    assert.equal(gen1Pokemon[5].evolutionFamilyId, 4)
    assert.ok(gen1Pokemon.every((p) => p.generation === 1))
  })
})
