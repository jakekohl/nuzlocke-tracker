const DEFAULT_ORIGINS = [
  'http://localhost:5173',
  'http://localhost:4173',
]

function getAllowedOrigins() {
  const fromEnv = process.env.CORS_ORIGINS?.trim()
  if (!fromEnv) return DEFAULT_ORIGINS
  return fromEnv.split(',').map((origin) => origin.trim()).filter(Boolean)
}

function resolveAllowOrigin(requestOrigin, allowedOrigins) {
  if (!requestOrigin) return null
  if (allowedOrigins.includes('*')) return '*'
  if (allowedOrigins.includes(requestOrigin)) return requestOrigin
  return null
}

export function applyCors(req, res) {
  const allowedOrigins = getAllowedOrigins()
  const allowOrigin = resolveAllowOrigin(req.headers.origin, allowedOrigins)

  if (allowOrigin) {
    res.setHeader('Access-Control-Allow-Origin', allowOrigin)
    if (allowOrigin !== '*') {
      res.setHeader('Access-Control-Allow-Credentials', 'true')
    }
  }

  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type, Authorization, X-Api-Key, x-api-key, X-Bootstrap-Secret, x-bootstrap-secret',
  )
  res.setHeader('Access-Control-Max-Age', '86400')
}

export function withCors(handler) {
  return async (req, res) => {
    applyCors(req, res)

    if (req.method === 'OPTIONS') {
      return res.status(204).end()
    }

    return handler(req, res)
  }
}
