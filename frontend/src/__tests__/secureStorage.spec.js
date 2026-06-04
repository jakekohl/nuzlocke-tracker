import { describe, it, expect, beforeEach, vi } from 'vitest'

import {
  encryptSecret,
  decryptSecret,
  persistApiKey,
  loadStoredApiKey,
} from '../lib/secureStorage'

function createMemorySessionStorage() {
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
    vi.stubGlobal('sessionStorage', createMemorySessionStorage())
  })

  it('round-trips a secret through encrypt and decrypt', async () => {
    const payload = await encryptSecret('my-api-key')
    const decrypted = await decryptSecret(payload)

    expect(decrypted).toBe('my-api-key')
  })

  it('does not store plaintext in session storage', async () => {
    await persistApiKey('secret-value')

    expect(sessionStorage.getItem('nuzlocke-api-key')).toBeNull()
    expect(sessionStorage.getItem('nuzlocke-api-key-encrypted')).not.toContain('secret-value')
    expect(await loadStoredApiKey()).toBe('secret-value')
  })

  it('migrates legacy plaintext storage to encrypted form', async () => {
    sessionStorage.setItem('nuzlocke-api-key', 'legacy-key')

    expect(await loadStoredApiKey()).toBe('legacy-key')
    expect(sessionStorage.getItem('nuzlocke-api-key')).toBeNull()
    expect(sessionStorage.getItem('nuzlocke-api-key-encrypted')).toBeTruthy()
  })
})
