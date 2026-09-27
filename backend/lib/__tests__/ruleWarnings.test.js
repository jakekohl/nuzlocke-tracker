import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { encounterStatuses } from '../../models/Encounter.js'
import {
  collectSpeciesWarnings,
  collectStatusWarnings,
  encounterOccupiesRoute,
  evaluateRouteOccupancy,
} from '../ruleWarnings.js'

const alive = { id: 1, status: encounterStatuses.alive, isShiny: false, isHmHelper: false }
const pidgey = { id: 16, evolutionFamilyId: 16, generation: 1, types: ['normal', 'flying'] }
const charmander = { id: 4, evolutionFamilyId: 4, generation: 1, types: ['fire'] }
const chikorita = { id: 152, evolutionFamilyId: 152, generation: 2, types: ['grass'] }

describe('encounterOccupiesRoute', () => {
  it('lets a missed encounter stay open when retry is on', () => {
    const missed = { status: encounterStatuses.failed, isHmHelper: false }
    assert.equal(encounterOccupiesRoute(missed, { missedEncounterRetry: true }), false)
    assert.equal(encounterOccupiesRoute(missed, { missedEncounterRetry: false }), true)
  })

  it('does not let an HM helper occupy the route', () => {
    assert.equal(encounterOccupiesRoute({ ...alive, isHmHelper: true }, {}), false)
  })
})

describe('evaluateRouteOccupancy', () => {
  const rules = { firstEncounterOnly: true, shinyClause: true, hmHelper: true }

  it('blocks a second catch on a used route', () => {
    const result = evaluateRouteOccupancy({
      rules,
      incoming: { status: encounterStatuses.alive, isShiny: false },
      othersOnRoute: [alive],
    })
    assert.equal(result.blocked, true)
  })

  it('allows a shiny on a used route and warns', () => {
    const result = evaluateRouteOccupancy({
      rules,
      incoming: { status: encounterStatuses.alive, isShiny: true },
      othersOnRoute: [alive],
    })
    assert.equal(result.blocked, false)
    assert.ok(result.warnings.includes('shinyClause'))
  })

  it('allows another catch after a miss when retry is on', () => {
    const result = evaluateRouteOccupancy({
      rules: { ...rules, missedEncounterRetry: true },
      incoming: { status: encounterStatuses.alive, isShiny: false },
      othersOnRoute: [{ status: encounterStatuses.failed }],
    })
    assert.equal(result.blocked, false)
    assert.deepEqual(result.warnings, [])
  })

  it('allows an HM helper without occupying the route and warns when it can battle', () => {
    const result = evaluateRouteOccupancy({
      rules,
      incoming: { status: encounterStatuses.alive, isHmHelper: true },
      othersOnRoute: [alive],
    })
    assert.equal(result.blocked, false)
    assert.ok(result.warnings.includes('hmHelper'))
  })
})

describe('collectSpeciesWarnings', () => {
  it('warns for a shared type and a later generation', () => {
    const warnings = collectSpeciesWarnings({
      rules: { noSharedTypes: true, sameGenerationOnly: true, dupesClause: false },
      pokemon: chikorita,
      teamTypes: new Set(['grass']),
      gameGeneration: 1,
    })
    assert.deepEqual(warnings, ['noSharedTypes', 'sameGenerationOnly'])
  })

  it('warns for a duplicate evolution line', () => {
    const warnings = collectSpeciesWarnings({
      rules: { dupesClause: true, shinyClause: true },
      pokemon: pidgey,
      isShiny: false,
      ownedFamilyIds: new Set([16]),
      teamTypes: new Set(),
      gameGeneration: 1,
    })
    assert.deepEqual(warnings, ['dupesClause'])
  })

  it('does not warn when the new species is unrelated', () => {
    const warnings = collectSpeciesWarnings({
      rules: { noSharedTypes: true, sameGenerationOnly: true, dupesClause: true },
      pokemon: charmander,
      ownedFamilyIds: new Set([16]),
      teamTypes: new Set(['water']),
      gameGeneration: 1,
    })
    assert.deepEqual(warnings, [])
  })
})

describe('collectStatusWarnings', () => {
  const encounter = { id: 1, status: encounterStatuses.alive, isShiny: true, isHmHelper: false }

  it('warns when a shiny is marked dead and when the last team member faints', () => {
    const warnings = collectStatusWarnings({
      rules: { shinyImmuneToPermadeath: true, blackoutIsFailure: true },
      encounter,
      nextStatus: encounterStatuses.dead,
      encounters: [
        encounter,
        { id: 2, status: encounterStatuses.boxed, isHmHelper: false },
      ],
    })
    assert.deepEqual(warnings, ['shinyImmuneToPermadeath', 'blackoutIsFailure'])
  })

  it('warns on a second revive', () => {
    const warnings = collectStatusWarnings({
      rules: { oneRevive: true },
      encounter: { id: 3, status: encounterStatuses.dead, isShiny: false },
      nextStatus: encounterStatuses.alive,
      revivesUsed: 1,
    })
    assert.deepEqual(warnings, ['oneRevive'])
  })

  it('allows the first revive without a warning', () => {
    const warnings = collectStatusWarnings({
      rules: { oneRevive: true },
      encounter: { id: 3, status: encounterStatuses.dead, isShiny: false },
      nextStatus: encounterStatuses.alive,
      revivesUsed: 0,
    })
    assert.deepEqual(warnings, [])
  })
})
