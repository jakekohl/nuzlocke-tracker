import { useApiKeyStore } from '@/stores/apiKey'

function resolveBaseUrl() {
  return (import.meta.env.VITE_API_BASE_URL ?? import.meta.env.VITE_API_URL ?? '').replace(
    /\/$/,
    '',
  )
}

export class ApiClient {
  constructor(baseUrl = resolveBaseUrl()) {
    this.baseUrl = baseUrl
  }

  buildUrl(path) {
    if (path.startsWith('http')) return path
    const normalized = path.startsWith('/') ? path : `/${path}`
    return `${this.baseUrl}${normalized}`
  }

  buildHeaders(extraHeaders, includeJsonContentType = false) {
    const { apiKey } = useApiKeyStore()
    const headers = new Headers(extraHeaders)

    if (includeJsonContentType && !headers.has('Content-Type')) {
      headers.set('Content-Type', 'application/json')
    }

    if (apiKey) {
      headers.set('x-api-key', apiKey)
    }

    return headers
  }

  /** Native fetch Response (for callers that need the raw response). */
  fetch(path, { method = 'GET', body, headers: extraHeaders } = {}) {
    const hasBody = body != null
    const headers = this.buildHeaders(extraHeaders, hasBody)

    return fetch(this.buildUrl(path), {
      method,
      headers,
      body: hasBody ? (typeof body === 'string' ? body : JSON.stringify(body)) : undefined,
    })
  }

  /**
   * @returns {Promise<{
   *   ok: boolean
   *   status: number
   *   statusText: string
   *   elapsed: number
   *   data: unknown
   * }>}
   */
  async request(method, path, { body, headers: extraHeaders } = {}) {
    const headers = this.buildHeaders(extraHeaders, body !== undefined)
    const url = this.buildUrl(path)
    const started = performance.now()

    const response = await fetch(url, {
      method,
      headers,
      body: body !== undefined ? JSON.stringify(body) : undefined,
    })

    const elapsed = Math.round(performance.now() - started)
    const text = await response.text()
    let data = null

    if (text) {
      try {
        data = JSON.parse(text)
      } catch {
        data = text
      }
    }

    return {
      ok: response.ok,
      status: response.status,
      statusText: response.statusText,
      elapsed,
      data,
    }
  }

  get(path, options) {
    return this.request('GET', path, options)
  }

  post(path, body, options = {}) {
    return this.request('POST', path, { ...options, body })
  }

  put(path, body, options = {}) {
    return this.request('PUT', path, { ...options, body })
  }

  delete(path, options = {}) {
    return this.request('DELETE', path, options)
  }

  /** GET /api/auth/me — verify access key and return current user */
  getMe() {
    return this.get('/api/auth/me')
  }

  /** GET /api/runs — list runs for the current user */
  listRuns() {
    return this.get('/api/runs')
  }

  /** GET /api/runs/rules — rule catalog for create/detail UI */
  getRunRulesCatalog() {
    return this.get('/api/runs/rules')
  }

  /** POST /api/runs — create a new run */
  createRun(body) {
    return this.post('/api/runs', body)
  }

  /** GET /api/runs/:id — fetch a run by id */
  getRun(id) {
    return this.get(`/api/runs/${encodeURIComponent(id)}`)
  }

  /** PUT /api/runs/:id — update run fields / rules */
  updateRun(id, body) {
    return this.put(`/api/runs/${encodeURIComponent(id)}`, body)
  }

  /** DELETE /api/runs/:id — soft-delete (archive) a run */
  deleteRun(id) {
    return this.delete(`/api/runs/${encodeURIComponent(id)}`)
  }

  /** GET /api/runs/:id/encounters */
  listEncounters(runId) {
    return this.get(`/api/runs/${encodeURIComponent(runId)}/encounters`)
  }

  /** POST /api/runs/:id/encounters */
  createEncounter(runId, body) {
    return this.post(`/api/runs/${encodeURIComponent(runId)}/encounters`, body)
  }

  /** PUT /api/runs/:id/encounters/:encounterId */
  updateEncounter(runId, encounterId, body) {
    return this.put(
      `/api/runs/${encodeURIComponent(runId)}/encounters/${encodeURIComponent(encounterId)}`,
      body,
    )
  }

  /** DELETE /api/runs/:id/encounters/:encounterId — soft-delete */
  deleteEncounter(runId, encounterId) {
    return this.delete(
      `/api/runs/${encodeURIComponent(runId)}/encounters/${encodeURIComponent(encounterId)}`,
    )
  }

  /** GET /api/pokemon?generation= */
  listPokemon({ generation } = {}) {
    const params = new URLSearchParams()
    if (generation != null) params.set('generation', String(generation))
    const qs = params.toString()
    return this.get(`/api/pokemon${qs ? `?${qs}` : ''}`)
  }

  /** GET /api/routes?gameId= */
  listRoutes({ gameId, encounterType } = {}) {
    const params = new URLSearchParams()
    if (gameId != null) params.set('gameId', String(gameId))
    if (encounterType) params.set('encounterType', encounterType)
    const qs = params.toString()
    return this.get(`/api/routes${qs ? `?${qs}` : ''}`)
  }
}

export const apiClient = new ApiClient()
