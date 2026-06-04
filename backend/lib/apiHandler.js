import connectToDatabase from './mongodb.js'

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

export async function getNextId(Model) {
  const latest = await Model.findOne().sort({ id: -1 }).select('id').lean()
  return latest?.id != null ? latest.id + 1 : 1
}