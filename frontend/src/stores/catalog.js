import { ref } from 'vue'
import { defineStore } from 'pinia'

import { apiClient } from '@/services/ApiClient'

/**
 * Session cache for nearly-static API catalogs (games, rules, pokemon, routes).
 * Cuts repeat Vercel function invocations when navigating between views.
 */
export const useCatalogStore = defineStore('catalog', () => {
  const games = ref(null)
  const rulesCatalog = ref(null)
  const pokemonByMaxGeneration = ref(new Map())
  const routesByGameId = ref(new Map())

  const gamesInflight = ref(null)
  const rulesInflight = ref(null)
  const pokemonInflight = ref(new Map())
  const routesInflight = ref(new Map())

  function pokemonKey(maxGeneration) {
    return maxGeneration == null ? 'all' : String(maxGeneration)
  }

  async function ensureGames() {
    if (Array.isArray(games.value)) {
      return { ok: true, status: 200, data: games.value }
    }
    if (gamesInflight.value) return gamesInflight.value

    gamesInflight.value = apiClient.listGames().then((result) => {
      if (result.ok && Array.isArray(result.data)) {
        games.value = result.data
      }
      return result
    })
    try {
      return await gamesInflight.value
    } finally {
      gamesInflight.value = null
    }
  }

  async function ensureRulesCatalog() {
    if (rulesCatalog.value) {
      return { ok: true, status: 200, data: rulesCatalog.value }
    }
    if (rulesInflight.value) return rulesInflight.value

    rulesInflight.value = apiClient.getRunRulesCatalog().then((result) => {
      if (result.ok && result.data && typeof result.data === 'object') {
        rulesCatalog.value = result.data
      }
      return result
    })
    try {
      return await rulesInflight.value
    } finally {
      rulesInflight.value = null
    }
  }

  async function ensurePokemon({ maxGeneration } = {}) {
    const key = pokemonKey(maxGeneration)
    if (pokemonByMaxGeneration.value.has(key)) {
      return { ok: true, status: 200, data: pokemonByMaxGeneration.value.get(key) }
    }
    if (pokemonInflight.value.has(key)) {
      return pokemonInflight.value.get(key)
    }

    const promise = apiClient.listPokemon({ maxGeneration }).then((result) => {
      if (result.ok && Array.isArray(result.data)) {
        const next = new Map(pokemonByMaxGeneration.value)
        next.set(key, result.data)
        pokemonByMaxGeneration.value = next
      }
      return result
    })
    pokemonInflight.value.set(key, promise)
    try {
      return await promise
    } finally {
      pokemonInflight.value.delete(key)
    }
  }

  async function ensureRoutes({ gameId } = {}) {
    const key = gameId == null ? 'all' : String(gameId)
    if (routesByGameId.value.has(key)) {
      return { ok: true, status: 200, data: routesByGameId.value.get(key) }
    }
    if (routesInflight.value.has(key)) {
      return routesInflight.value.get(key)
    }

    const promise = apiClient.listRoutes({ gameId }).then((result) => {
      if (result.ok && Array.isArray(result.data)) {
        const next = new Map(routesByGameId.value)
        next.set(key, result.data)
        routesByGameId.value = next
      }
      return result
    })
    routesInflight.value.set(key, promise)
    try {
      return await promise
    } finally {
      routesInflight.value.delete(key)
    }
  }

  /** Test helper */
  function clear() {
    games.value = null
    rulesCatalog.value = null
    pokemonByMaxGeneration.value = new Map()
    routesByGameId.value = new Map()
    gamesInflight.value = null
    rulesInflight.value = null
    pokemonInflight.value = new Map()
    routesInflight.value = new Map()
  }

  return {
    games,
    rulesCatalog,
    pokemonByMaxGeneration,
    routesByGameId,
    ensureGames,
    ensureRulesCatalog,
    ensurePokemon,
    ensureRoutes,
    clear,
  }
})
