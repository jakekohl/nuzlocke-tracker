import { describe, it, expect } from 'vitest'
import { shouldWarnDupes } from '@/lib/dupes'
import { encounterStatuses } from '@/constants/encounterStatuses'

describe('shouldWarnDupes', () => {
  const pidgey = { id: 16, name: 'Pidgey', evolutionFamilyId: 16 }
  const pidgeotto = { id: 17, name: 'Pidgeotto', evolutionFamilyId: 16 }
  const pokemonById = new Map([
    [16, pidgey],
    [17, pidgeotto],
  ])
  const encounters = [{ id: 1, pokemonId: 16, status: encounterStatuses.alive }]

  it('warns when the same family is already alive', () => {
    expect(
      shouldWarnDupes({
        rules: { dupesClause: true, shinyClause: true },
        isShiny: false,
        pokemon: pidgeotto,
        encounters,
        pokemonById,
      }),
    ).toBe(true)
  })

  it('ignores shinies when shiny clause is on', () => {
    expect(
      shouldWarnDupes({
        rules: { dupesClause: true, shinyClause: true },
        isShiny: true,
        pokemon: pidgeotto,
        encounters,
        pokemonById,
      }),
    ).toBe(false)
  })
})
