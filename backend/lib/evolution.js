import { nationalDex } from '../data/nationalDex.js'
import { getPokemonById } from './pokemonService.js'

/** @type {Map<number, number[]>} */
const evolvesToByFromId = new Map()

for (const row of nationalDex) {
  if (row.evolvesFromId == null) continue
  const list = evolvesToByFromId.get(row.evolvesFromId) ?? []
  list.push(row.id)
  evolvesToByFromId.set(row.evolvesFromId, list)
}

/**
 * Immediate next-stage species ids for a Pokémon (vanilla evolution line).
 * @param {number|string} pokemonId
 * @returns {number[]}
 */
export function getEvolvesToIds(pokemonId) {
  const id = Number(pokemonId)
  if (!Number.isFinite(id)) return []
  return [...(evolvesToByFromId.get(id) ?? [])]
}

/**
 * Whether fromId may evolve into toId under the given run settings.
 * @param {number|string} fromId
 * @param {number|string} toId
 * @param {{ randomEvolutions?: boolean, maxGeneration?: number|null }} options
 */
export function canEvolveTo(fromId, toId, { randomEvolutions = false, maxGeneration = null } = {}) {
  const from = Number(fromId)
  const to = Number(toId)
  if (!Number.isFinite(from) || !Number.isFinite(to)) return false
  if (from === to) return false

  const target = getPokemonById(to)
  if (!target) return false

  if (maxGeneration != null && maxGeneration !== '') {
    const max = Number(maxGeneration)
    if (Number.isFinite(max) && target.generation > max) return false
  }

  if (randomEvolutions) return true

  return getEvolvesToIds(from).includes(to)
}
