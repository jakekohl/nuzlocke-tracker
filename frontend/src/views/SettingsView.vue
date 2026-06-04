<script setup>
import { ref } from 'vue'
import { useApiKeyStore } from '@/stores/apiKey'

const apiKeyStore = useApiKeyStore()
const dialogRef = ref(null)
const draftKey = ref('')
const saveMessage = ref('')

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
  saveMessage.value = apiKeyStore.isConfigured
    ? 'API key saved (encrypted in this tab’s session storage).'
    : 'API key cleared.'
  closeModal()
}
</script>

<template>
  <main class="settings">
    <h1>Settings</h1>

    <p v-if="apiKeyStore.isConfigured" class="status status--ok">API key is configured.</p>
    <p v-else class="status status--warn">No API key configured. Backend requests will be unauthorized.</p>

    <p v-if="saveMessage" class="save-message" role="status">{{ saveMessage }}</p>

    <button type="button" class="btn btn--primary" data-test="api-button-set" @click="openModal">
      {{ apiKeyStore.isConfigured ? 'Update API Key' : 'Set API Key' }}
    </button>

    <dialog ref="dialogRef" class="modal" @cancel.prevent="closeModal" @close="onDialogClose">
      <form method="dialog" class="modal__form" @submit.prevent="saveApiKey">
        <h2>API Key</h2>

        <label class="field" for="api-key-input">API Key</label>
        <input
          id="api-key-input"
          v-model="draftKey"
          type="password"
          name="apiKey"
          autocomplete="off"
          class="field__input"
          data-test="api-key-input"
          placeholder="Enter your API key"
        />

        <div class="modal__actions">
          <button type="button" data-test="api-button-cancel" class="btn" @click="closeModal">Cancel</button>
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

.save-message {
  margin: 0 0 1rem;
  color: #1565c0;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  background: #fff;
  cursor: pointer;
  font: inherit;
}

.btn--primary {
  border-color: #1976d2;
  background: #1976d2;
  color: #fff;
}

.btn--primary:hover {
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
