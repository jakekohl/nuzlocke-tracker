import { requireUser } from '../auth.js'
import { setCatalogCacheHeaders } from '../cacheHeaders.js'
import { listGamesCatalog } from '../gameCatalog.js'

export async function handleGames(req, res, segments) {
  if (segments.length === 1 && req.method === 'GET') {
    const user = await requireUser(req, res)
    if (!user) return
    setCatalogCacheHeaders(res)
    return res.status(200).json(listGamesCatalog())
  }

  if (segments.length === 1) {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  return res.status(404).json({ message: 'Not found' })
}
