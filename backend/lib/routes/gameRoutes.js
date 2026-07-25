import { requireUser } from '../auth.js'
import { getRouteParam } from '../requestParams.js'
import { getRouteById, listRoutes } from '../routeService.js'

export async function handleGameRoutes(req, res, segments) {
  // GET /api/routes?gameId=1&region=kanto&encounterType=wild
  if (segments.length === 1 && req.method === 'GET') {
    const user = await requireUser(req, res)
    if (!user) return

    const routes = await listRoutes({
      gameId: req.query?.gameId,
      region: req.query?.region,
      encounterType: req.query?.encounterType,
    })
    return res.status(200).json(routes)
  }

  // GET /api/routes/:id
  if (segments.length === 2 && req.method === 'GET') {
    const user = await requireUser(req, res)
    if (!user) return

    const id = getRouteParam(req, 'id') ?? segments[1]
    const route = await getRouteById(id)
    if (!route) {
      return res.status(404).json({ message: 'Route not found' })
    }
    return res.status(200).json(route)
  }

  if (segments.length === 1) {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  return res.status(404).json({ message: 'Not found' })
}
