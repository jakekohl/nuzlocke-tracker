import { requireBootstrap } from '../auth.js'
import { seedReferenceData } from '../seedService.js'

/**
 * Catalog sizes for Pokémon and locations (in-memory consts, not Mongo).
 * POST /api/seed  (x-bootstrap-secret)
 */
export async function handleSeed(req, res, segments) {
  if (segments.length === 1 && req.method === 'POST') {
    if (!requireBootstrap(req, res)) return

    return res.status(200).json(seedReferenceData())
  }

  if (segments.length === 1) {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  return res.status(404).json({ message: 'Not found' })
}
