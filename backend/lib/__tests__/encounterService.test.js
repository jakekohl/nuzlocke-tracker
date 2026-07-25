import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildEncounterUpdates,
  validateEncounterInput,
  encounterStatuses,
} from '../encounterService.js'

describe('validateEncounterInput', () => {
  const valid = {
    routeId: 2,
    pokemonId: 16,
    nickname: 'Birdy',
    status: encounterStatuses.alive,
  }

  it('accepts a valid create payload', () => {
    assert.doesNotThrow(() => validateEncounterInput(valid))
  })

  it('requires nickname when run rules demand it', () => {
    assert.throws(
      () =>
        validateEncounterInput(
          { ...valid, nickname: '  ' },
          { runRules: { nicknameRequired: true } },
        ),
      (error) => error.statusCode === 400 && /nickname/i.test(error.message),
    )
  })

  it('allows failed encounters without pokemonId', () => {
    assert.doesNotThrow(() =>
      validateEncounterInput({
        routeId: 2,
        status: encounterStatuses.failed,
        nickname: '',
      }),
    )
  })

  it('rejects invalid status', () => {
    assert.throws(
      () => validateEncounterInput({ ...valid, status: 99 }),
      (error) => error.statusCode === 400 && /status/i.test(error.message),
    )
  })
})

describe('buildEncounterUpdates', () => {
  it('maps partial fields and never requires routeId on patch', () => {
    const updates = buildEncounterUpdates(
      { nickname: 'Sparky', status: encounterStatuses.dead },
      {},
      1_700_000_000,
    )
    assert.equal(updates.nickname, 'Sparky')
    assert.equal(updates.status, encounterStatuses.dead)
    assert.equal(updates.updated, 1_700_000_000)
    assert.equal('routeId' in updates, false)
  })
})
