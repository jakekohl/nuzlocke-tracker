import Pokemon from '../models/Pokemon.js'
import Route from '../models/Route.js'
import { gen1Pokemon } from '../data/gen1Pokemon.js'
import { kantoRedBlueRoutes } from '../data/kantoRedBlueRoutes.js'

/**
 * Upsert Gen 1 Pokémon + Red/Blue Kanto routes. Safe to re-run.
 */
export async function seedReferenceData() {
  const pokemonOps = gen1Pokemon.map((row) => ({
    updateOne: {
      filter: { id: row.id },
      update: { $set: row },
      upsert: true,
    },
  }))
  const routeOps = kantoRedBlueRoutes.map((row) => ({
    updateOne: {
      filter: { id: row.id },
      update: { $set: row },
      upsert: true,
    },
  }))

  const [pokemonResult, routeResult] = await Promise.all([
    Pokemon.bulkWrite(pokemonOps),
    Route.bulkWrite(routeOps),
  ])

  return {
    pokemon: {
      upserted: pokemonResult.upsertedCount,
      modified: pokemonResult.modifiedCount,
      matched: pokemonResult.matchedCount,
      total: gen1Pokemon.length,
    },
    routes: {
      upserted: routeResult.upsertedCount,
      modified: routeResult.modifiedCount,
      matched: routeResult.matchedCount,
      total: kantoRedBlueRoutes.length,
    },
  }
}
