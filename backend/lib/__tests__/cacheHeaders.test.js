import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { CATALOG_CACHE_CONTROL, setCatalogCacheHeaders } from '../cacheHeaders.js'

describe('cacheHeaders', () => {
  it('sets private catalog Cache-Control', () => {
    const headers = {}
    const res = {
      setHeader(key, value) {
        headers[key] = value
      },
    }
    setCatalogCacheHeaders(res)
    assert.equal(headers['Cache-Control'], CATALOG_CACHE_CONTROL)
    assert.match(CATALOG_CACHE_CONTROL, /private/)
    assert.match(CATALOG_CACHE_CONTROL, /max-age=3600/)
  })
})
