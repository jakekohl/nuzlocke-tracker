import { GAMES } from './games.js'
import { allLocations } from '../data/locations/index.js'

export function locationCountByGameId() {
  const counts = new Map()
  for (const location of allLocations) {
    for (const gameId of location.gameIds) {
      counts.set(gameId, (counts.get(gameId) ?? 0) + 1)
    }
  }
  return counts
}

export function listGamesCatalog() {
  const counts = locationCountByGameId()
  return GAMES.map((game) => ({
    id: game.id,
    slug: game.slug,
    label: game.label,
    generation: game.generation,
    locationCount: counts.get(game.id) ?? 0,
  })).filter((game) => game.locationCount > 0)
}

export const supportedGameIds = new Set(listGamesCatalog().map((game) => game.id))
