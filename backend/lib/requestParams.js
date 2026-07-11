/**
 * Normalize catch-all path segments from a Vercel `[...path]` request.
 * @returns {string[]}
 */
export function getPathSegments(req) {
  const fromQuery = req.query?.path
  if (fromQuery != null) {
    if (Array.isArray(fromQuery)) {
      return fromQuery.map(String).filter(Boolean)
    }
    const asString = String(fromQuery).trim()
    if (asString) {
      return asString.split('/').filter(Boolean)
    }
  }

  if (!req.url) return []

  const pathname = new URL(req.url, 'http://localhost').pathname
  const segments = pathname.split('/').filter(Boolean)
  // Drop leading "api" so handlers see ["runs", "1"] not ["api", "runs", "1"]
  if (segments[0] === 'api') {
    return segments.slice(1)
  }
  return segments
}

/**
 * Resolve a dynamic route param from the Vercel/Node request.
 * Prefers req.query (Vercel dynamic segments) and falls back to the URL path.
 */
export function getRouteParam(req, paramName) {
  const fromQuery = req.query?.[paramName]
  if (fromQuery != null && fromQuery !== '') {
    return Array.isArray(fromQuery) ? String(fromQuery[0]) : String(fromQuery)
  }

  const segments = getPathSegments(req)

  if (paramName === 'id' && segments.length >= 2 && segments[0] === 'runs') {
    return segments[1]
  }

  return null
}
