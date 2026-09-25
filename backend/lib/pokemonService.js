import { nationalDex } from '../data/nationalDex.js'

const pokemonById = new Map(nationalDex.map((row) => [row.id, row]))

export function toPokemonResponse(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    name: doc.name,
    generation: doc.generation,
    types: [...doc.types],
    evolutionFamilyId: doc.evolutionFamilyId,
    evolvesFromId: doc.evolvesFromId ?? null,
  }
}

export function listPokemon({ generation, maxGeneration } = {}) {
  let rows = nationalDex
  if (generation != null && generation !== '') {
    const gen = Number(generation)
    rows = rows.filter((row) => row.generation === gen)
  } else if (maxGeneration != null && maxGeneration !== '') {
    const max = Number(maxGeneration)
    rows = rows.filter((row) => row.generation <= max)
  }
  return rows.map(toPokemonResponse)
}

export function getPokemonById(id) {
  return toPokemonResponse(pokemonById.get(Number(id)) ?? null)
}
