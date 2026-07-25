import Pokemon from '../models/Pokemon.js'

export function toPokemonResponse(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    name: doc.name,
    generation: doc.generation,
    types: doc.types,
    evolutionFamilyId: doc.evolutionFamilyId,
  }
}

export async function listPokemon({ generation } = {}) {
  const query = {}
  if (generation != null && generation !== '') {
    query.generation = Number(generation)
  }
  const rows = await Pokemon.find(query).sort({ id: 1 }).lean()
  return rows.map(toPokemonResponse)
}

export async function getPokemonById(id) {
  const pokemon = await Pokemon.findOne({ id: Number(id) }).lean()
  return toPokemonResponse(pokemon)
}
