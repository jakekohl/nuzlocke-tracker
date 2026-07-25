import { requireUser } from '../auth.js'
import { getRouteParam } from '../requestParams.js'
import { getRulesCatalog } from '../runRules.js'
import {
  createEncounter,
  getEncounterById,
  inactiveEncounter,
  listEncountersForRun,
  updateEncounter,
} from '../encounterService.js'
import {
  createRun,
  getRunById,
  listRunsForUser,
  updateRun,
  inactiveRun,
} from '../runService.js'

async function requireOwnedRun(req, res, runId) {
  const user = await requireUser(req, res)
  if (!user) return null

  const run = await getRunById(runId)
  if (!run || run.userId !== user.id) {
    res.status(404).json({ message: 'Run not found' })
    return null
  }

  return { user, run }
}

export async function handleRuns(req, res, segments) {
  // GET /api/runs/rules — rule catalog for create/edit UI
  if (segments.length === 2 && segments[1] === 'rules' && req.method === 'GET') {
    const user = await requireUser(req, res)
    if (!user) return
    return res.status(200).json({ rules: getRulesCatalog() })
  }

  // GET /api/runs — list current user's runs
  if (segments.length === 1 && req.method === 'GET') {
    const user = await requireUser(req, res)
    if (!user) return
    const runs = await listRunsForUser(user.id)
    return res.status(200).json(runs)
  }

  // POST /api/runs
  if (segments.length === 1 && req.method === 'POST') {
    const user = await requireUser(req, res)
    if (!user) return

    const body = { ...(req.body ?? {}), userId: user.id }
    const run = await createRun(body)
    return res.status(201).json(run)
  }

  // /api/runs/:id/encounters
  if (segments.length === 3 && segments[2] === 'encounters') {
    const runId = getRouteParam(req, 'id') ?? segments[1]
    const owned = await requireOwnedRun(req, res, runId)
    if (!owned) return

    if (req.method === 'GET') {
      const encounters = await listEncountersForRun(runId)
      return res.status(200).json(encounters)
    }

    if (req.method === 'POST') {
      try {
        const encounter = await createEncounter(runId, owned.user.id, req.body ?? {})
        return res.status(201).json(encounter)
      } catch (error) {
        if (error.statusCode) {
          return res.status(error.statusCode).json({ message: error.message })
        }
        throw error
      }
    }

    return res.status(405).json({ message: 'Method not allowed' })
  }

  // /api/runs/:id/encounters/:encounterId
  if (segments.length === 4 && segments[2] === 'encounters') {
    const runId = getRouteParam(req, 'id') ?? segments[1]
    const encounterId = segments[3]
    const owned = await requireOwnedRun(req, res, runId)
    if (!owned) return

    try {
      switch (req.method) {
        case 'GET': {
          const encounter = await getEncounterById(encounterId)
          if (!encounter || encounter.runId !== Number(runId)) {
            return res.status(404).json({ message: 'Encounter not found' })
          }
          return res.status(200).json(encounter)
        }
        case 'PUT': {
          const encounter = await updateEncounter(
            runId,
            encounterId,
            owned.user.id,
            req.body ?? {},
          )
          return res.status(200).json(encounter)
        }
        case 'DELETE': {
          const encounter = await inactiveEncounter(runId, encounterId, owned.user.id)
          return res.status(200).json(encounter)
        }
        default:
          return res.status(405).json({ message: 'Method not allowed' })
      }
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ message: error.message })
      }
      throw error
    }
  }

  // /api/runs/:id
  if (segments.length === 2) {
    const user = await requireUser(req, res)
    if (!user) return

    const id = getRouteParam(req, 'id') ?? segments[1]
    if (!id || id === 'rules') {
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
