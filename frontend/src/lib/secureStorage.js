/**
 * Client-side encryption for values persisted in localStorage.
 *
 * Uses AES-GCM with a random wrapping key stored alongside the ciphertext.
 * This hides the API key from casual storage inspection and keeps ciphertext
 * separate from the wrap key, but it is not true secret storage: any script
 * running on this origin (including XSS) can still decrypt and use the key.
 * A server-side or OS-level vault is required for that level of protection.
 */

const WRAP_KEY_STORAGE = 'nuzlocke-wrap-key'
const ENCRYPTED_KEY_STORAGE = 'nuzlocke-api-key-encrypted'
const LEGACY_PLAINTEXT_STORAGE = 'nuzlocke-api-key'

function bytesToBase64(bytes) {
  return btoa(String.fromCharCode(...bytes))
}

function base64ToBytes(value) {
  return Uint8Array.from(atob(value), (char) => char.charCodeAt(0))
}

/** Read a key from localStorage, falling back to sessionStorage (pre-persist migration). */
function readStorage(key) {
  return localStorage.getItem(key) ?? sessionStorage.getItem(key)
}

function writeStorage(key, value) {
  localStorage.setItem(key, value)
  sessionStorage.removeItem(key)
}

function removeStorage(key) {
  localStorage.removeItem(key)
  sessionStorage.removeItem(key)
}

async function getOrCreateWrapKey() {
  let raw = readStorage(WRAP_KEY_STORAGE)

  if (!raw) {
    const keyBytes = crypto.getRandomValues(new Uint8Array(32))
    raw = bytesToBase64(keyBytes)
  }

  writeStorage(WRAP_KEY_STORAGE, raw)

  const keyData = base64ToBytes(raw)
  return crypto.subtle.importKey('raw', keyData, { name: 'AES-GCM' }, false, ['encrypt', 'decrypt'])
}

/**
 * @param {string} plaintext
 * @returns {Promise<string|null>} JSON payload stored in localStorage, or null when empty
 */
export async function encryptSecret(plaintext) {
  const trimmed = plaintext.trim()
  if (!trimmed) return null

  const key = await getOrCreateWrapKey()
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const encoded = new TextEncoder().encode(trimmed)
  const ciphertext = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, encoded)

  return JSON.stringify({
    v: 1,
    iv: bytesToBase64(iv),
    data: bytesToBase64(new Uint8Array(ciphertext)),
  })
}

/**
 * @param {string|null} payload
 * @returns {Promise<string>}
 */
export async function decryptSecret(payload) {
  if (!payload) return ''

  const { iv, data } = JSON.parse(payload)
  const key = await getOrCreateWrapKey()
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBytes(iv) },
    key,
    base64ToBytes(data),
  )

  return new TextDecoder().decode(decrypted)
}

export async function loadStoredApiKey() {
  try {
    const encrypted = readStorage(ENCRYPTED_KEY_STORAGE)
    if (encrypted) {
      const plaintext = await decryptSecret(encrypted)
      // Promote sessionStorage values into durable localStorage.
      writeStorage(ENCRYPTED_KEY_STORAGE, encrypted)
      return plaintext
    }

    const legacy = readStorage(LEGACY_PLAINTEXT_STORAGE)
    if (legacy) {
      await persistApiKey(legacy)
      return legacy.trim()
    }

    return ''
  } catch {
    return ''
  }
}

export async function persistApiKey(plaintext) {
  try {
    const trimmed = plaintext.trim()

    if (!trimmed) {
      removeStorage(ENCRYPTED_KEY_STORAGE)
      removeStorage(LEGACY_PLAINTEXT_STORAGE)
      removeStorage(WRAP_KEY_STORAGE)
      return
    }

    const encrypted = await encryptSecret(trimmed)
    writeStorage(ENCRYPTED_KEY_STORAGE, encrypted)
    removeStorage(LEGACY_PLAINTEXT_STORAGE)
  } catch {
    // localStorage or Web Crypto unavailable
  }
}
