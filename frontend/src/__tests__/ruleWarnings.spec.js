import { describe, it, expect } from 'vitest'
import { encounterStatuses } from '@/constants/encounterStatuses'
import {
  collectFormWarnings,
  collectStatusWarnings,
  speciesHintTags,
} from '@/lib/ruleWarnings'

const pidgey = { id: 16, name: 'Pidgey', evolutionFamilyId: 16, generation: 1, types: ['normal', 'flying'] }
const pidgeotto = {
  id: 17,
  name: 'Pidgeotto',
  evolutionFamilyId: 16,
  generation: 1,
  types: ['normal', 'flying'],
}
const chikorita = { id: 152, name: 'Chikorita', evolutionFamilyId: 152, generation: 2, types: ['grass'] }
const pokemonById = new Map([
  [16, pidgey],
  [17, pidgeotto],
  [152, chikorita],
])
const encounters = [{ id: 1, pokemonId: 16, status: encounterStatuses.alive }]

describe('speciesHintTags', () => {
  it('tags an owned line, a shared type, and another generation', () => {
    expect(
      speciesHintTags(pidgeotto, {
        rules: { dupesClause: true, noSharedTypes: true },
        encounters,
        pokemonById,
        gameGeneration: 1,
      }),
    ).toEqual(['Owned line', 'Shared type'])

    expect(
      speciesHintTags(chikorita, {
        rules: { sameGenerationOnly: true, noSharedTypes: true },
        encounters,
        pokemonById,
        gameGeneration: 1,
      }),
    ).toEqual(['Other gen'])
  })
})

describe('collectFormWarnings', () => {
  it('warns when a shiny is logged on a used route', () => {
    expect(
      collectFormWarnings({
        rules: { shinyClause: true, dupesClause: true },
        pokemon: chikorita,
        isShiny: true,
        routeOccupied: true,
        encounters,
        pokemonById,
        gameGeneration: 1,
      }),
    ).toEqual(['shinyClause'])
  })
})

describe('collectStatusWarnings', () => {
  it('warns on a second revive', () => {
    expect(
      collectStatusWarnings({
        rules: { oneRevive: true },
        encounter: { id: 4, status: encounterStatuses.dead, isShiny: false },
        nextStatus: encounterStatuses.alive,
        revivesUsed: 1,
      }),
    ).toEqual(['oneRevive'])
  })
})
