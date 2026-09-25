/** Browser-private cache for nearly-static authenticated catalog GETs. */
export const CATALOG_CACHE_CONTROL = 'private, max-age=3600'

export function setCatalogCacheHeaders(res) {
  res.setHeader('Cache-Control', CATALOG_CACHE_CONTROL)
}
