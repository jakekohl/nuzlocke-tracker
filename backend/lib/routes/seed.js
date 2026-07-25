import { requireBootstrap } from '../auth.js'
import { seedReferenceData } from '../seedService.js'

/**
 * Admin-only reference data seeding.
 * POST /api/seed  (x-bootstrap-secret)
 */
export async function handleSeed(req, res, segments) {
  if (segments.length === 1 && req.method === 'POST') {
    if (!requireBootstrap(req, res)) return

    const result = await seedReferenceData()
    return res.status(200).json(result)
  }

  if (segments.length === 1) {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  return res.status(404).json({ message: 'Not found' })
}
