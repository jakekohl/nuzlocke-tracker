import { withDb, authCheck } from '../lib/apiHandler.js'
import { createRun } from '../lib/runService.js'

export default withDb(async (req, res) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const apiKey = req.headers['x-api-key']

  if (authCheck(apiKey)) {
    const run = await createRun(req.body)
    return res.status(201).json(run)
  }
    return res.status(401).json({ message: 'Unauthorized' });
})
