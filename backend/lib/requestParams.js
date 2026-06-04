/**
 * Resolve a dynamic route param from the Vercel/Node request.
 * Prefers req.query (Vercel dynamic segments) and falls back to the URL path.
 */
export function getRouteParam(req, paramName) {
  const fromQuery = req.query?.[paramName]
  if (fromQuery != null && fromQuery !== '') {
    return Array.isArray(fromQuery) ? String(fromQuery[0]) : String(fromQuery)
  }

  if (!req.url) return null

  const pathname = new URL(req.url, 'http://localhost').pathname
  const segments = pathname.split('/').filter(Boolean)

  // /api/runs/:id — id is the last segment
  if (paramName === 'id' && segments.length >= 3 && segments[segments.length - 2] === 'runs') {
    return segments[segments.length - 1]
  }

  return null
}
