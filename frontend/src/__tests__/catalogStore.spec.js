import { describe, it, expect, beforeEach, vi } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'

import { useCatalogStore } from '../stores/catalog'

vi.mock('@/services/ApiClient', () => ({
  apiClient: {
    listGames: vi.fn(),
    getRunRulesCatalog: vi.fn(),
    listPokemon: vi.fn(),
    listRoutes: vi.fn(),
  },
}))

import { apiClient } from '@/services/ApiClient'

describe('useCatalogStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })

  it('caches games across ensureGames calls', async () => {
    const store = useCatalogStore()
    const games = [{ id: 1, name: 'Red' }]
    vi.mocked(apiClient.listGames).mockResolvedValue({ ok: true, status: 200, data: games })

    const first = await store.ensureGames()
    const second = await store.ensureGames()

    expect(first.data).toEqual(games)
    expect(second.data).toEqual(games)
    expect(apiClient.listGames).toHaveBeenCalledTimes(1)
  })

  it('caches pokemon by maxGeneration', async () => {
    const store = useCatalogStore()
    vi.mocked(apiClient.listPokemon).mockResolvedValue({
      ok: true,
      status: 200,
      data: [{ id: 1, name: 'Bulbasaur' }],
    })

    await store.ensurePokemon({ maxGeneration: 1 })
    await store.ensurePokemon({ maxGeneration: 1 })
    await store.ensurePokemon({ maxGeneration: 2 })

    expect(apiClient.listPokemon).toHaveBeenCalledTimes(2)
    expect(apiClient.listPokemon).toHaveBeenNthCalledWith(1, { maxGeneration: 1 })
    expect(apiClient.listPokemon).toHaveBeenNthCalledWith(2, { maxGeneration: 2 })
  })

  it('caches routes by gameId', async () => {
    const store = useCatalogStore()
    vi.mocked(apiClient.listRoutes).mockResolvedValue({
      ok: true,
      status: 200,
      data: [{ id: 1, name: 'Pallet Town' }],
    })

    await store.ensureRoutes({ gameId: 1 })
    await store.ensureRoutes({ gameId: 1 })
    await store.ensureRoutes({ gameId: 2 })

    expect(apiClient.listRoutes).toHaveBeenCalledTimes(2)
  })

  it('dedupes in-flight requests', async () => {
    const store = useCatalogStore()
    let resolveGames
    vi.mocked(apiClient.listGames).mockImplementation(
      () =>
        new Promise((resolve) => {
          resolveGames = () => resolve({ ok: true, status: 200, data: [{ id: 1 }] })
        }),
    )

    const a = store.ensureGames()
    const b = store.ensureGames()
    resolveGames()
    await Promise.all([a, b])

    expect(apiClient.listGames).toHaveBeenCalledTimes(1)
  })
})
