<script setup>
import { ref } from 'vue'
import { useApiKeyStore } from '@/stores/apiKey'
import { apiClient } from '@/services/ApiClient'

const apiKeyStore = useApiKeyStore()
const dialogRef = ref(null)
const draftKey = ref('')
const saveMessage = ref('')
const verifyMessage = ref('')
const verifyError = ref('')
const verifiedUser = ref(null)
const verifying = ref(false)

function openModal() {
  draftKey.value = apiKeyStore.apiKey
  saveMessage.value = ''
  dialogRef.value?.showModal()
}

function closeModal() {
  dialogRef.value?.close()
}

function onDialogClose() {
  draftKey.value = ''
}

async function saveApiKey() {
  await apiKeyStore.setApiKey(draftKey.value)
  verifiedUser.value = null
  verifyMessage.value = ''
  verifyError.value = ''
  saveMessage.value = apiKeyStore.isConfigured
    ? 'Access key saved for this browser tab session.'
    : 'Access key cleared.'
  closeModal()
}

async function clearKey() {
  await apiKeyStore.clearApiKey()
  verifiedUser.value = null
  verifyMessage.value = ''
  verifyError.value = ''
  saveMessage.value = 'Access key cleared.'
}

async function verifyConnection() {
  verifyMessage.value = ''
  verifyError.value = ''
  verifiedUser.value = null

  if (!apiKeyStore.isConfigured) {
    verifyError.value = 'Set an access key before verifying.'
    return
  }

  verifying.value = true
  try {
    const result = await apiClient.getMe()
    if (!result.ok) {
      verifyError.value =
        (typeof result.data === 'object' && result.data?.message) ||
        (result.status === 401
          ? 'Key was rejected. Check the value and try again.'
          : result.status === 404
            ? 'API route not found. Is the backend running with the latest vercel.json rewrites?'
            : `Verification failed (${result.status}).`)
      return
    }

    verifiedUser.value = result.data
    verifyMessage.value = `Connected as ${result.data.email}.`
  } catch (error) {
    const detail = error instanceof Error ? error.message : ''
    verifyError.value = detail
      ? `Could not reach the API (${detail}). Check VITE_API_BASE_URL and that the backend is running.`
      : 'Could not reach the API. Check VITE_API_BASE_URL and that the backend is running.'
  } finally {
    verifying.value = false
  }
}
</script>

<template>
  <main class="settings">
    <h1>Settings</h1>
    <p class="lede">
      Paste the personal access key issued when your account was created. It is stored encrypted in
      this tab’s session only — not in a password manager sync or long-lived cookie.
    </p>

    <p v-if="apiKeyStore.isConfigured" class="status status--ok" data-test="api-key-status">
      Access key is configured
      <span v-if="apiKeyStore.apiKey" class="prefix">({{ apiKeyStore.apiKey.slice(0, 8) }}…)</span>
    </p>
    <p v-else class="status status--warn" data-test="api-key-status">
      No access key configured. Backend requests will be unauthorized.
    </p>

    <p v-if="saveMessage" class="save-message" role="status" data-test="save-message">{{ saveMessage }}</p>
    <p v-if="verifyMessage" class="verify-message" role="status" data-test="verify-message">
      {{ verifyMessage }}
    </p>
    <p v-if="verifyError" class="verify-error" role="alert" data-test="verify-error">{{ verifyError }}</p>
    <p v-if="verifiedUser" class="verified-user" data-test="verified-user">
      {{ verifiedUser.name || 'User' }} · {{ verifiedUser.email }}
    </p>

    <div class="actions">
      <button type="button" class="btn btn--primary" data-test="api-button-set" @click="openModal">
        {{ apiKeyStore.isConfigured ? 'Update Access Key' : 'Set Access Key' }}
      </button>
      <button
        v-if="apiKeyStore.isConfigured"
        type="button"
        class="btn"
        data-test="api-button-clear"
        @click="clearKey"
      >
        Clear Key
      </button>
      <button
        type="button"
        class="btn"
        data-test="api-button-verify"
        :disabled="verifying || !apiKeyStore.isConfigured"
        @click="verifyConnection"
      >
        {{ verifying ? 'Verifying…' : 'Verify Connection' }}
      </button>
    </div>

    <dialog ref="dialogRef" class="modal" @cancel.prevent="closeModal" @close="onDialogClose">
      <form method="dialog" class="modal__form" @submit.prevent="saveApiKey">
        <h2>Access Key</h2>
        <p class="modal__hint">
          Keys look like <code>nuz_…</code> and are issued once by an admin. Treat them like a
          password.
        </p>

        <label class="field" for="api-key-input">Access Key</label>
        <input
          id="api-key-input"
          v-model="draftKey"
          type="password"
          name="apiKey"
          autocomplete="off"
          class="field__input"
          data-test="api-key-input"
          placeholder="nuz_…"
        />

        <div class="modal__actions">
          <button type="button" data-test="api-button-cancel" class="btn" @click="closeModal">
            Cancel
          </button>
          <button type="submit" data-test="api-button-save" class="btn btn--primary">Save</button>
        </div>
      </form>
    </dialog>
  </main>
</template>

<style scoped>
.settings {
  max-width: 32rem;
  margin: 2rem auto;
  padding: 0 1rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.lede {
  margin: 0 0 1.25rem;
  color: #444;
  line-height: 1.45;
  font-size: 0.95rem;
}

.status {
  margin: 0 0 1rem;
  padding: 0.75rem 1rem;
  border-radius: 0.375rem;
}

.status--ok {
  background: #e8f5e9;
  color: #1b5e20;
}

.status--warn {
  background: #fff3e0;
  color: #e65100;
}

.prefix {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
}

.save-message,
.verify-message {
  margin: 0 0 1rem;
  color: #1565c0;
}

.verify-error {
  margin: 0 0 1rem;
  color: #c62828;
}

.verified-user {
  margin: 0 0 1rem;
  font-size: 0.9rem;
  color: #333;
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  background: #fff;
  cursor: pointer;
  font: inherit;
}

.btn:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.btn--primary {
  border-color: #1976d2;
  background: #1976d2;
  color: #fff;
}

.btn--primary:hover:not(:disabled) {
  background: #1565c0;
}

.modal {
  width: min(100% - 2rem, 24rem);
  padding: 0;
  border: none;
  border-radius: 0.5rem;
  box-shadow: 0 1rem 2rem rgb(0 0 0 / 20%);
}

.modal::backdrop {
  background: rgb(0 0 0 / 45%);
}

.modal__form {
  padding: 1.25rem;
}

.modal__form h2 {
  margin: 0 0 0.5rem;
  font-size: 1.25rem;
}

.modal__hint {
  margin: 0 0 1rem;
  font-size: 0.875rem;
  color: #555;
  line-height: 1.4;
}

.field {
  display: block;
  margin-bottom: 0.375rem;
  font-weight: 600;
  font-size: 0.875rem;
}

.field__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.5rem 0.75rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  font: inherit;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
</style>
