import { withDb } from '../../lib/apiHandler.js'
import {
  getRunById,
  updateRun,
  inactiveRun,
} from '../../lib/runService.js'

export default withDb(async (req, res) => {
  const { id } = req.query

  if (!id) {
    return res.status(400).json({ message: 'Run ID is required' })
  }

  switch (req.method) {
    case 'GET': {
      const run = await getRunById(id)
      if (!run) {
        return res.status(404).json({ message: 'Run not found' })
      }
      return res.status(200).json(run)
    }
    case 'PUT': {
      const run = await updateRun(id, req.body ?? {})
      if (!run) {
        return res.status(404).json({ message: 'Run not found' })
      }
      return res.status(200).json(run)
    }
    case 'DELETE': {
      const run = await deleteRun(id)
      if (!run) {
        return res.status(404).json({ message: 'Run not found' })
      }
      return res.status(200).json(run)
    }
    default:
      return res.status(405).json({ message: 'Method not allowed' })
  }
})
