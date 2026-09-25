import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { nationalDex } from '../../data/nationalDex.js'

describe('nationalDex catalog', () => {
  it('includes National Dex 1–1025 with families and types', () => {
    assert.equal(nationalDex.length, 1025)
    assert.equal(nationalDex[0].id, 1)
    assert.equal(nationalDex[1024].id, 1025)
    assert.equal(nationalDex[5].name, 'Charizard')
    assert.deepEqual(nationalDex[5].types, ['fire', 'flying'])
    assert.equal(nationalDex[5].evolutionFamilyId, 4)
    assert.equal(nationalDex[5].evolvesFromId, 5)
    assert.equal(nationalDex[0].evolvesFromId, null)
    assert.equal(nationalDex[1].evolvesFromId, 1)
    assert.equal(nationalDex.filter((p) => p.generation === 1).length, 151)
    assert.ok(nationalDex.every((p) => p.types.length >= 1 && p.types.length <= 2))
    assert.ok(nationalDex.every((p) => Number.isInteger(p.evolutionFamilyId)))
    assert.ok(
      nationalDex.every(
        (p) => p.evolvesFromId === null || Number.isInteger(p.evolvesFromId),
      ),
    )
  })
})
