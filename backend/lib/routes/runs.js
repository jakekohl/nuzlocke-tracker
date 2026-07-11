import { requireUser } from '../auth.js'
import { getRouteParam } from '../requestParams.js'
import {
  createRun,
  getRunById,
  updateRun,
  inactiveRun,
} from '../runService.js'

export async function handleRuns(req, res, segments) {
  // POST /api/runs
  if (segments.length === 1 && req.method === 'POST') {
    const user = await requireUser(req, res)
    if (!user) return

    const body = { ...(req.body ?? {}), userId: user.id }
    const run = await createRun(body)
    return res.status(201).json(run)
  }

  // /api/runs/:id
  if (segments.length === 2) {
    const user = await requireUser(req, res)
    if (!user) return

    const id = getRouteParam(req, 'id') ?? segments[1]
    if (!id) {
      return res.status(400).json({ message: 'Run ID is required' })
    }

    switch (req.method) {
      case 'GET': {
        const run = await getRunById(id)
        if (!run || run.userId !== user.id) {
          return res.status(404).json({ message: 'Run not found' })
        }
        return res.status(200).json(run)
      }
      case 'PUT': {
        const existing = await getRunById(id)
        if (!existing || existing.userId !== user.id) {
          return res.status(404).json({ message: 'Run not found' })
        }
        const run = await updateRun(id, req.body ?? {})
        return res.status(200).json(run)
      }
      case 'DELETE': {
        const existing = await getRunById(id)
        if (!existing || existing.userId !== user.id) {
          return res.status(404).json({ message: 'Run not found' })
        }
        const run = await inactiveRun(id)
        return res.status(200).json(run)
      }
      default:
        return res.status(405).json({ message: 'Method not allowed' })
    }
  }

  if (segments.length === 1) {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  return res.status(404).json({ message: 'Not found' })
}
