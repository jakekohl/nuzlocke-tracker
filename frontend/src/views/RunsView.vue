<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useApiKeyStore } from '@/stores/apiKey'
import { apiClient } from '@/services/ApiClient'
import { supportedGames, formatGame, gameIds } from '@/constants/games'
import { formatRunStatus, runStatuses } from '@/constants/runStatuses'
import { formatUnixDate, todayIsoDate } from '@/lib/dates'

const apiKeyStore = useApiKeyStore()
const router = useRouter()

const runs = ref([])
const loading = ref(false)
const error = ref('')
const creating = ref(false)
const createError = ref('')
const dialogRef = ref(null)

const form = ref({
  name: '',
  gameId: gameIds.red,
  startDate: todayIsoDate(),
  status: runStatuses.notStarted,
})

const hasKey = computed(() => apiKeyStore.isConfigured)
const isEmpty = computed(() => !loading.value && !error.value && runs.value.length === 0)

function apiMessage(result, fallback) {
  if (typeof result.data === 'object' && result.data?.message) return result.data.message
  return fallback
}

async function loadRuns() {
  error.value = ''
  runs.value = []

  if (!hasKey.value) {
    error.value = 'Set an access key in Settings before viewing runs.'
    return
  }

  loading.value = true
  try {
    const result = await apiClient.listRuns()
    if (!result.ok) {
      error.value =
        result.status === 401
          ? 'Access key was rejected. Update it in Settings.'
          : apiMessage(result, `Could not load runs (${result.status}).`)
      return
    }
    runs.value = Array.isArray(result.data) ? result.data : []
  } catch (err) {
    const detail = err instanceof Error ? err.message : ''
    error.value = detail
      ? `Could not reach the API (${detail}).`
      : 'Could not reach the API. Check VITE_API_BASE_URL and that the backend is running.'
  } finally {
    loading.value = false
  }
}

function openCreate() {
  createError.value = ''
  form.value = {
    name: '',
    gameId: gameIds.red,
    startDate: todayIsoDate(),
    status: runStatuses.notStarted,
  }
  dialogRef.value?.showModal()
}

function closeCreate() {
  dialogRef.value?.close()
}

async function submitCreate() {
  createError.value = ''
  const name = form.value.name.trim()
  if (!name) {
    createError.value = 'Name is required.'
    return
  }

  creating.value = true
  try {
    const result = await apiClient.createRun({
      name,
      gameId: Number(form.value.gameId),
      startDate: form.value.startDate,
      status: Number(form.value.status),
    })
    if (!result.ok) {
      createError.value = apiMessage(result, `Could not create run (${result.status}).`)
      return
    }
    closeCreate()
    await router.push({ name: 'run-detail', params: { id: result.data.id } })
  } catch (err) {
    const detail = err instanceof Error ? err.message : ''
    createError.value = detail ? `Could not reach the API (${detail}).` : 'Could not reach the API.'
  } finally {
    creating.value = false
  }
}

onMounted(loadRuns)
</script>

<template>
  <main class="runs" data-test="runs-page">
    <header class="page-header">
      <div>
        <h1>Runs</h1>
        <p class="lede">Your Nuzlocke playthroughs — start a new attempt or open an existing one.</p>
      </div>
      <button
        type="button"
        class="btn btn--primary"
        data-test="runs-button-new"
        :disabled="!hasKey"
        @click="openCreate"
      >
        New run
      </button>
    </header>

    <p v-if="loading" class="state" data-test="runs-loading">Loading runs…</p>
    <p v-else-if="error" class="state state--error" role="alert" data-test="runs-error">
      {{ error }}
      <RouterLink v-if="!hasKey" to="/settings" class="inline-link" data-test="runs-link-settings">
        Open Settings
      </RouterLink>
    </p>
    <p v-else-if="isEmpty" class="state" data-test="runs-empty">
      No runs yet. Create one to start tracking Red or Blue.
    </p>

    <ul v-else class="run-list" data-test="runs-list">
      <li v-for="run in runs" :key="run.id" class="run-row">
        <RouterLink
          :to="{ name: 'run-detail', params: { id: run.id } }"
          class="run-row__link"
          :data-test="`run-link-${run.id}`"
        >
          <span class="run-row__name">{{ run.name }}</span>
          <span class="run-row__meta">
            <span class="pill">{{ formatGame(run.gameId) }}</span>
            <span class="pill pill--status">{{ formatRunStatus(run.status) }}</span>
            <span class="muted">Started {{ formatUnixDate(run.startDate) }}</span>
          </span>
        </RouterLink>
      </li>
    </ul>

    <dialog ref="dialogRef" class="modal" data-test="runs-create-dialog" @cancel.prevent="closeCreate">
      <form class="modal__form" @submit.prevent="submitCreate">
        <h2>New run</h2>
        <p class="modal__hint">Red and Blue are supported first. Rules default to a standard Nuzlocke.</p>

        <label class="field" for="run-name">Name</label>
        <input
          id="run-name"
          v-model="form.name"
          type="text"
          class="field__input"
          data-test="run-name-input"
          placeholder="Kanto Red Nuzlocke"
          required
        />

        <label class="field" for="run-game">Game</label>
        <select id="run-game" v-model.number="form.gameId" class="field__input" data-test="run-game-select">
          <option v-for="game in supportedGames" :key="game.id" :value="game.id">
            {{ game.label }}
          </option>
        </select>

        <label class="field" for="run-start">Start date</label>
        <input
          id="run-start"
          v-model="form.startDate"
          type="date"
          class="field__input"
          data-test="run-start-input"
          required
        />

        <p v-if="createError" class="state state--error" role="alert" data-test="runs-create-error">
          {{ createError }}
        </p>

        <div class="modal__actions">
          <button type="button" class="btn" data-test="runs-create-cancel" @click="closeCreate">
            Cancel
          </button>
          <button
            type="submit"
            class="btn btn--primary"
            data-test="runs-create-submit"
            :disabled="creating"
          >
            {{ creating ? 'Creating…' : 'Create run' }}
          </button>
        </div>
      </form>
    </dialog>
  </main>
</template>

<style scoped>
.runs {
  max-width: 40rem;
  margin: 2rem auto;
  padding: 0 1rem 3rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.page-header h1 {
  margin: 0 0 0.35rem;
  font-size: 1.75rem;
}

.lede {
  margin: 0;
  color: #444;
  line-height: 1.45;
  font-size: 0.95rem;
}

.state {
  margin: 0;
  padding: 0.875rem 1rem;
  border-radius: 0.375rem;
  background: #f5f5f5;
  color: #333;
}

.state--error {
  background: #ffebee;
  color: #c62828;
}

.inline-link {
  display: inline-block;
  margin-left: 0.35rem;
  color: #1565c0;
}

.run-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.run-row {
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  background: #fff;
}

.run-row__link {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 1rem 1.1rem;
  color: inherit;
  text-decoration: none;
}

.run-row__link:hover {
  background: #fafafa;
}

.run-row__name {
  font-weight: 600;
  font-size: 1.05rem;
  color: #1a1a1a;
}

.run-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
}

.pill {
  display: inline-block;
  padding: 0.15rem 0.5rem;
  border-radius: 999px;
  background: #e3f2fd;
  color: #0d47a1;
  font-weight: 500;
}

.pill--status {
  background: #f3e5f5;
  color: #6a1b9a;
}

.muted {
  color: #666;
}

.btn {
  padding: 0.5rem 1rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  background: #fff;
  cursor: pointer;
  font: inherit;
  white-space: nowrap;
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
  margin: 0.75rem 0 0.375rem;
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
