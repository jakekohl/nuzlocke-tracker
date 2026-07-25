/**
 * CLI: upsert Gen 1 Pokémon + Red/Blue routes into MongoDB.
 *
 *   cd backend && npm run seed
 *
 * Uses the same env vars as the API (MONGODB_URI or MONGODB_*).
 * Loads backend/.env via Node --env-file (see package.json).
 */
import connectToDatabase from '../lib/mongodb.js'
import { seedReferenceData } from '../lib/seedService.js'

async function main() {
  await connectToDatabase()
  const result = await seedReferenceData()
  console.log(JSON.stringify(result, null, 2))
  process.exit(0)
}

main().catch((error) => {
  console.error(error)
  process.exit(1)
})
