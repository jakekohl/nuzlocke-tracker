import { getPathSegments } from './requestParams.js'
import { handleAuth } from './routes/auth.js'
import { handleRuns } from './routes/runs.js'
import { handleUsers } from './routes/users.js'

/**
 * Dispatch a request to the appropriate route handler.
 * Path segments are relative to /api (e.g. ["runs", "1"]).
 */
export async function dispatch(req, res) {
  const segments = getPathSegments(req)

  if (segments.length === 0) {
    return res.status(404).json({ message: 'Not found' })
  }

  switch (segments[0]) {
    case 'users':
      return handleUsers(req, res, segments)
    case 'auth':
      return handleAuth(req, res, segments)
    case 'runs':
      return handleRuns(req, res, segments)
    default:
      return res.status(404).json({ message: 'Not found' })
  }
}
