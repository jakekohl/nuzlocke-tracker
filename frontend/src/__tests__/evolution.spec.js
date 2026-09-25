import { describe, it, expect } from 'vitest'
import {
  buildEvolutionTimeline,
  canShowEvolve,
  filterEvolveOptions,
} from '../lib/evolution.js'

const options = [
  { id: 1, name: 'Bulbasaur', evolvesFromId: null },
  { id: 2, name: 'Ivysaur', evolvesFromId: 1 },
  { id: 3, name: 'Venusaur', evolvesFromId: 2 },
  { id: 25, name: 'Pikachu', evolvesFromId: 172 },
]

describe('filterEvolveOptions', () => {
  it('returns only next stages in vanilla mode', () => {
    expect(filterEvolveOptions(options, 1, { randomEvolutions: false }).map((p) => p.id)).toEqual([
      2,
    ])
    expect(filterEvolveOptions(options, 3, { randomEvolutions: false })).toEqual([])
  })

  it('returns any other species when random evolutions is on', () => {
    const ids = filterEvolveOptions(options, 1, { randomEvolutions: true }).map((p) => p.id)
    expect(ids).toEqual([2, 3, 25])
  })
})

describe('canShowEvolve', () => {
  it('is true when vanilla next stages exist', () => {
    expect(canShowEvolve({ pokemonId: 1 }, options, { randomEvolutions: false })).toBe(true)
    expect(canShowEvolve({ pokemonId: 3 }, options, { randomEvolutions: false })).toBe(false)
  })
})

describe('buildEvolutionTimeline', () => {
  it('shows only the caught form when history is empty', () => {
    expect(
      buildEvolutionTimeline({
        pokemonId: 1,
        caughtAt: 100,
        level: 5,
        evolutionHistory: [],
      }),
    ).toEqual([{ pokemonId: 1, kind: 'caught', evolvedAt: 100, level: 5 }])
  })

  it('includes catch plus each evolution step', () => {
    const timeline = buildEvolutionTimeline({
      pokemonId: 3,
      caughtAt: 100,
      evolutionHistory: [
        { fromPokemonId: 1, toPokemonId: 2, evolvedAt: 200, level: 16 },
        { fromPokemonId: 2, toPokemonId: 3, evolvedAt: 300, level: 32 },
      ],
    })
    expect(timeline).toEqual([
      { pokemonId: 1, kind: 'caught', evolvedAt: 100, level: null },
      { pokemonId: 2, kind: 'evolved', evolvedAt: 200, level: 16 },
      { pokemonId: 3, kind: 'evolved', evolvedAt: 300, level: 32 },
    ])
  })
})
