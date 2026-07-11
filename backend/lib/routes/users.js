import { requireBootstrap, requireUser } from '../auth.js'
import { createUser, rotateApiKey, rotateApiKeyByEmail } from '../userService.js'

export async function handleUsers(req, res, segments) {
  // POST /api/users
  if (segments.length === 1 && req.method === 'POST') {
    if (!requireBootstrap(req, res)) return

    try {
      const { name, email } = req.body ?? {}
      if (!email) {
        return res.status(400).json({ message: 'Email is required' })
      }

      const { user, apiKey } = await createUser({ name, email })
      return res.status(201).json({ user, apiKey })
    } catch (error) {
      if (error.statusCode === 409) {
        return res.status(409).json({ message: error.message })
      }
      throw error
    }
  }

  // POST /api/users/rotate-key — authenticated user rotates their own key
  if (segments.length === 2 && segments[1] === 'rotate-key' && req.method === 'POST') {
    const user = await requireUser(req, res)
    if (!user) return

    const result = await rotateApiKey(user.id)
    if (!result) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({ user: result.user, apiKey: result.apiKey })
  }

  // POST /api/users/reset-key — admin recovery when the access key is lost
  if (segments.length === 2 && segments[1] === 'reset-key' && req.method === 'POST') {
    if (!requireBootstrap(req, res)) return

    const { email } = req.body ?? {}
    if (!email) {
      return res.status(400).json({ message: 'Email is required' })
    }

    const result = await rotateApiKeyByEmail(email)
    if (!result) {
      return res.status(404).json({ message: 'User not found' })
    }

    return res.status(200).json({ user: result.user, apiKey: result.apiKey })
  }

  if (
    segments.length === 1 ||
    (segments.length === 2 && (segments[1] === 'rotate-key' || segments[1] === 'reset-key'))
  ) {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  return res.status(404).json({ message: 'Not found' })
}
