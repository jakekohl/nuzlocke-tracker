<script setup>
import { ref } from 'vue'
import { useApiKeyStore } from '@/stores/apiKey'
import { apiClient } from '@/services/ApiClient'

const apiKeyStore = useApiKeyStore()
const dialogOpen = ref(false)
const draftKey = ref('')
const saveMessage = ref('')
const verifyMessage = ref('')
const verifyError = ref('')
const verifiedUser = ref(null)
const verifying = ref(false)

function openModal() {
  draftKey.value = apiKeyStore.apiKey
  saveMessage.value = ''
  dialogOpen.value = true
}

function closeModal() {
  dialogOpen.value = false
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
  <main class="settings page page--narrow" data-test="settings-page">
    <header class="page-header">
      <h1>Settings</h1>
      <p class="lede">
        Paste the personal access key issued when your account was created. It is stored encrypted in
        this tab’s session only — not in a password manager sync or long-lived cookie.
      </p>
    </header>

    <section class="access-panel surface" aria-labelledby="access-heading">
      <h2 id="access-heading">Access</h2>

      <Message
        v-if="apiKeyStore.isConfigured"
        severity="success"
        :closable="false"
        data-test="api-key-status"
      >
        Access key is configured
        <span v-if="apiKeyStore.apiKey" class="prefix">({{ apiKeyStore.apiKey.slice(0, 8) }}…)</span>
      </Message>
      <Message v-else severity="warn" :closable="false" data-test="api-key-status">
        No access key configured. Backend requests will be unauthorized.
      </Message>

      <p v-if="saveMessage" class="feedback feedback--ok" role="status" data-test="save-message">
        {{ saveMessage }}
      </p>
      <p v-if="verifyMessage" class="feedback feedback--ok" role="status" data-test="verify-message">
        {{ verifyMessage }}
      </p>
      <p v-if="verifyError" class="feedback feedback--error" role="alert" data-test="verify-error">
        {{ verifyError }}
      </p>
      <p v-if="verifiedUser" class="verified-user" data-test="verified-user">
        {{ verifiedUser.name || 'User' }} · {{ verifiedUser.email }}
      </p>

      <div class="actions">
        <Button
          :label="apiKeyStore.isConfigured ? 'Update Access Key' : 'Set Access Key'"
          data-test="api-button-set"
          @click="openModal"
        />
        <Button
          v-if="apiKeyStore.isConfigured"
          label="Clear Key"
          severity="secondary"
          outlined
          data-test="api-button-clear"
          @click="clearKey"
        />
        <Button
          :label="verifying ? 'Verifying…' : 'Verify Connection'"
          severity="secondary"
          data-test="api-button-verify"
          :disabled="verifying || !apiKeyStore.isConfigured"
          :loading="verifying"
          @click="verifyConnection"
        />
      </div>
    </section>

    <Dialog
      v-model:visible="dialogOpen"
      modal
      header="Access Key"
      data-test="api-key-dialog"
      @hide="draftKey = ''"
    >
      <form class="modal__form" @submit.prevent="saveApiKey">
        <p class="field-hint">
          Keys look like <code>nuz_…</code> and are issued once by an admin. Treat them like a
          password.
        </p>

        <label class="field-label" for="api-key-input">Access Key</label>
        <InputText
          id="api-key-input"
          v-model="draftKey"
          type="password"
          autocomplete="off"
          class="w-full"
          data-test="api-key-input"
          placeholder="nuz_…"
        />

        <div class="modal__actions">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            data-test="api-button-cancel"
            @click="closeModal"
          />
          <Button type="submit" label="Save" data-test="api-button-save" />
        </div>
      </form>
    </Dialog>
  </main>
</template>

<style scoped>
.page-header {
  margin-bottom: var(--space-5);
}

.page-header h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
}

.lede {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.5;
  font-size: 1rem;
}

.access-panel {
  display: grid;
  gap: var(--space-3);
  padding: var(--space-5);
}

.access-panel h2 {
  margin: 0;
  font-size: 1.15rem;
}

.prefix {
  font-family: ui-monospace, monospace;
  font-size: 0.875rem;
}

.feedback {
  margin: 0;
  font-size: 0.95rem;
}

.feedback--ok {
  color: var(--color-primary-strong);
}

.feedback--error {
  color: var(--color-danger);
}

.verified-user {
  margin: 0;
  font-size: 0.9rem;
  color: var(--color-ink);
}

.actions {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 0.25rem;
}

.modal__form {
  display: grid;
}

.w-full {
  width: 100%;
}

.modal__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

@media (max-width: 39.99rem) {
  .actions :deep(.p-button) {
    flex: 1 1 100%;
  }
}
</style>
