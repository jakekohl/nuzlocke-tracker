import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { getPokemonById, listPokemon } from '../pokemonService.js'

describe('listPokemon', () => {
  it('returns the full National Dex in id order', () => {
    const rows = listPokemon()
    assert.equal(rows.length, 1025)
    assert.equal(rows[0].id, 1)
    assert.equal(rows[1024].id, 1025)
    assert.equal(rows[5].evolutionFamilyId, 4)
  })

  it('filters by generation and maxGeneration', () => {
    const gen1 = listPokemon({ generation: 1 })
    assert.equal(gen1.length, 151)
    assert.ok(gen1.every((row) => row.generation === 1))

    const throughGen2 = listPokemon({ maxGeneration: 2 })
    assert.ok(throughGen2.length > 151)
    assert.ok(throughGen2.every((row) => row.generation <= 2))
  })
})

describe('getPokemonById', () => {
  it('returns a species by National Dex number', () => {
    const charizard = getPokemonById(6)
    assert.equal(charizard.name, 'Charizard')
    assert.deepEqual(charizard.types, ['fire', 'flying'])
  })

  it('returns null for unknown ids', () => {
    assert.equal(getPokemonById(99999), null)
  })
})
