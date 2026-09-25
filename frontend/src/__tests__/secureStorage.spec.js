import { describe, it, expect, beforeEach, vi } from 'vitest'

import { encryptSecret, decryptSecret, persistApiKey, loadStoredApiKey } from '../lib/secureStorage'

function createMemoryStorage() {
  const data = new Map()
  return {
    getItem: (key) => (data.has(key) ? data.get(key) : null),
    setItem: (key, value) => data.set(key, value),
    removeItem: (key) => data.delete(key),
    clear: () => data.clear(),
  }
}

describe('secureStorage', () => {
  beforeEach(() => {
    vi.stubGlobal('localStorage', createMemoryStorage())
    vi.stubGlobal('sessionStorage', createMemoryStorage())
  })

  it('round-trips a secret through encrypt and decrypt', async () => {
    const payload = await encryptSecret('my-api-key')
    const decrypted = await decryptSecret(payload)

    expect(decrypted).toBe('my-api-key')
  })

  it('does not store plaintext in local storage', async () => {
    await persistApiKey('secret-value')

    expect(localStorage.getItem('nuzlocke-api-key')).toBeNull()
    expect(localStorage.getItem('nuzlocke-api-key-encrypted')).not.toContain('secret-value')
    expect(await loadStoredApiKey()).toBe('secret-value')
  })

  it('migrates legacy plaintext storage to encrypted form', async () => {
    localStorage.setItem('nuzlocke-api-key', 'legacy-key')

    expect(await loadStoredApiKey()).toBe('legacy-key')
    expect(localStorage.getItem('nuzlocke-api-key')).toBeNull()
    expect(localStorage.getItem('nuzlocke-api-key-encrypted')).toBeTruthy()
  })

  it('migrates sessionStorage values into localStorage', async () => {
    await persistApiKey('session-key')
    // Simulate pre-persist layout: values only in sessionStorage
    const wrap = localStorage.getItem('nuzlocke-wrap-key')
    const encrypted = localStorage.getItem('nuzlocke-api-key-encrypted')
    localStorage.clear()
    sessionStorage.setItem('nuzlocke-wrap-key', wrap)
    sessionStorage.setItem('nuzlocke-api-key-encrypted', encrypted)

    expect(await loadStoredApiKey()).toBe('session-key')
    expect(localStorage.getItem('nuzlocke-api-key-encrypted')).toBeTruthy()
    expect(sessionStorage.getItem('nuzlocke-api-key-encrypted')).toBeNull()
  })
})
