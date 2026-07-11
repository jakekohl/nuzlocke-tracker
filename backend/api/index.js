import { withApi } from '../lib/apiHandler.js'
import { dispatch } from '../lib/router.js'

/**
 * Single Vercel serverless function for the entire API.
 * Nested paths are rewritten here via vercel.json (catch-all filenames are Next.js-only).
 */
export default withApi(async (req, res) => {
  return dispatch(req, res)
})
