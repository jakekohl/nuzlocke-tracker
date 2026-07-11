import { requireUser } from '../auth.js'

export async function handleAuth(req, res, segments) {
  // GET /api/auth/me
  if (segments.length === 2 && segments[1] === 'me') {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' })
    }

    const user = await requireUser(req, res)
    if (!user) return

    return res.status(200).json({
      id: user.id,
      name: user.name,
      email: user.email,
      apiKeyPrefix: user.apiKeyPrefix,
    })
  }

  return res.status(404).json({ message: 'Not found' })
}
