import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

import { loadStoredApiKey, persistApiKey } from '@/lib/secureStorage'

export const useApiKeyStore = defineStore('apiKey', () => {
  const apiKey = ref('')
  const hydrated = ref(false)

  const isConfigured = computed(() => apiKey.value.length > 0)

  async function hydrateFromStorage() {
    apiKey.value = await loadStoredApiKey()
    hydrated.value = true
  }

  async function setApiKey(key) {
    const trimmed = key.trim()
    apiKey.value = trimmed
    await persistApiKey(trimmed)
  }

  async function clearApiKey() {
    await setApiKey('')
  }

  return { apiKey, hydrated, isConfigured, hydrateFromStorage, setApiKey, clearApiKey }
})
