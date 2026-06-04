import { apiClient } from './ApiClient.js'

export { ApiClient, apiClient } from './ApiClient.js'

export function apiFetch(path, options = {}) {
  return apiClient.fetch(path, options)
}

export async function apiJson(path, options = {}) {
  const response = await apiFetch(path, options)
  const data = await response.json().catch(() => null)

  if (!response.ok) {
    const message = data?.message ?? response.statusText
    throw new Error(message || `Request failed (${response.status})`)
  }

  return data
}
