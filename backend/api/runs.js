import { withDb } from '../lib/apiHandler.js'
import { createRun } from '../lib/runService.js'

export default withDb(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const run = await createRun(req.body)
  return res.status(201).json(run)
})
