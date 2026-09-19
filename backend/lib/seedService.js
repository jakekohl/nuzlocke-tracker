import { nationalDex } from '../data/nationalDex.js'
import { allLocations } from '../data/locations/index.js'

/**
 * Pokémon and locations are static modules, not Mongo collections.
 * Kept so POST /api/seed and `npm run seed` still report catalog sizes.
 */
export function seedReferenceData() {
  return {
    source: 'static',
    pokemon: { total: nationalDex.length },
    routes: { total: allLocations.length },
  }
}
