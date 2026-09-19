/**
 * Report static Pokémon + location catalog sizes (nothing is written to Mongo).
 *
 *   cd backend && npm run seed
 */
import { seedReferenceData } from '../lib/seedService.js'

console.log(JSON.stringify(seedReferenceData(), null, 2))
