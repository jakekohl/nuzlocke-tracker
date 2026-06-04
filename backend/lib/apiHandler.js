import connectToDatabase from './mongodb.js'
import { withCors } from './cors.js'

export function authCheck(apiKey) {
  let authorized = false
  if (!apiKey)
    return authorized
  else if (apiKey == process.env.API_KEY)
    return authorized = true
  else
    return authorized;
}

export function withDb(handler) {
  return async (req, res) => {
    try {
      await connectToDatabase()
      return await handler(req, res)
    } catch (error) {
      console.error(error)
      return res.status(500).json({ message: 'Internal server error' })
    }
  }
}

export function withApi(handler) {
  return withCors(withDb(handler))
}

export async function getNextId(Model) {
  const latest = await Model.findOne().sort({ id: -1 }).select('id').lean()
  return latest?.id != null ? latest.id + 1 : 1
}