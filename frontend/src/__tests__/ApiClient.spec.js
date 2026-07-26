import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { ApiClient } from '../services/ApiClient'
import { useApiKeyStore } from '../stores/apiKey'

describe('ApiClient', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.stubGlobal('fetch', vi.fn())
  })

  it('sends x-api-key on GET requests', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('test-secret')

    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 200 }))

    const client = new ApiClient('http://localhost:3000')
    await client.getRun(1)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/runs/1',
      expect.objectContaining({
        method: 'GET',
        headers: expect.any(Headers),
      }),
    )

    const headers = vi.mocked(fetch).mock.calls[0][1].headers
    expect(headers.get('x-api-key')).toBe('test-secret')
  })

  it('POSTs JSON body to create a run', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 1 }), { status: 201 }))

    const client = new ApiClient('http://localhost:3000')
    const body = { name: 'Run', startDate: 1, userId: 1, gameId: 1 }
    await client.createRun(body)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/runs',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  })

  it('GETs /api/auth/me with the access key', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_testkey')

    vi.mocked(fetch).mockResolvedValue(
      new Response(JSON.stringify({ id: 1, email: 'a@b.co' }), { status: 200 }),
    )

    const client = new ApiClient('http://localhost:3000')
    const result = await client.getMe()

    expect(result.ok).toBe(true)
    expect(result.data.email).toBe('a@b.co')
    const headers = vi.mocked(fetch).mock.calls[0][1].headers
    expect(headers.get('x-api-key')).toBe('nuz_testkey')
  })

  it('lists runs from GET /api/runs', async () => {
    const store = useApiKeyStore()
    await store.setApiKey('nuz_testkey')
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify([]), { status: 200 }))

    const client = new ApiClient('http://localhost:3000')
    await client.listRuns()

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/runs',
      expect.objectContaining({ method: 'GET' }),
    )
  })

  it('PUTs run updates and DELETEs runs', async () => {
    vi.mocked(fetch)
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }))
      .mockResolvedValueOnce(new Response(JSON.stringify({ id: 1 }), { status: 200 }))
    const client = new ApiClient('http://localhost:3000')

    await client.updateRun(1, { notes: 'hi' })
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/runs/1',
      expect.objectContaining({
        method: 'PUT',
        body: JSON.stringify({ notes: 'hi' }),
      }),
    )

    await client.deleteRun(1)
    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/runs/1',
      expect.objectContaining({ method: 'DELETE' }),
    )
  })

  it('posts encounters under a run', async () => {
    vi.mocked(fetch).mockResolvedValue(new Response(JSON.stringify({ id: 9 }), { status: 201 }))
    const client = new ApiClient('http://localhost:3000')
    const body = { routeId: 2, pokemonId: 16, nickname: 'Birdy', status: 0 }

    await client.createEncounter(3, body)

    expect(fetch).toHaveBeenCalledWith(
      'http://localhost:3000/api/runs/3/encounters',
      expect.objectContaining({
        method: 'POST',
        body: JSON.stringify(body),
      }),
    )
  })
})
