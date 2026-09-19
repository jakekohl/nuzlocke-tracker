import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  buildEncounterUpdates,
  validateEncounterInput,
  encounterStatuses,
  shouldWarnDupesClause,
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

  it('allows skipped encounters without pokemonId', () => {
    assert.doesNotThrow(() =>
      validateEncounterInput({
        routeId: 2,
        status: encounterStatuses.skipped,
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

describe('shouldWarnDupesClause', () => {
  const pidgey = { id: 16, evolutionFamilyId: 16 }
  const owned = new Set([16])

  it('warns when the family is already owned and dupes clause is on', () => {
    assert.equal(
      shouldWarnDupesClause({
        runRules: { dupesClause: true, shinyClause: true },
        isShiny: false,
        pokemon: pidgey,
        ownedFamilyIds: owned,
      }),
      true,
    )
  })

  it('does not warn for shinies when shiny clause is on', () => {
    assert.equal(
      shouldWarnDupesClause({
        runRules: { dupesClause: true, shinyClause: true },
        isShiny: true,
        pokemon: pidgey,
        ownedFamilyIds: owned,
      }),
      false,
    )
  })

  it('does not warn when dupes clause is off', () => {
    assert.equal(
      shouldWarnDupesClause({
        runRules: { dupesClause: false },
        isShiny: false,
        pokemon: pidgey,
        ownedFamilyIds: owned,
      }),
      false,
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
