<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useApiKeyStore } from '@/stores/apiKey'
import { apiClient } from '@/services/ApiClient'
import { fallbackGames, formatGame, gameIds } from '@/constants/games'
import { formatRunStatus, runStatuses } from '@/constants/runStatuses'
import { formatUnixDate, todayIsoDate } from '@/lib/dates'
import { gamesGroupedByGeneration } from '@/lib/gamesUi'

const apiKeyStore = useApiKeyStore()
const router = useRouter()

const runs = ref([])
const games = ref(fallbackGames)
const presets = ref([])
const loading = ref(false)
const error = ref('')
const creating = ref(false)
const createError = ref('')
const createOpen = ref(false)

const form = ref({
  name: '',
  gameId: gameIds.red,
  startDate: todayIsoDate(),
  status: runStatuses.notStarted,
  presetId: 'standard',
})

const hasKey = computed(() => apiKeyStore.isConfigured)
const isEmpty = computed(() => !loading.value && !error.value && runs.value.length === 0)
const groupedGames = computed(() => gamesGroupedByGeneration(games.value))
const selectedPreset = computed(
  () => presets.value.find((preset) => preset.id === form.value.presetId) ?? null,
)

function apiMessage(result, fallback) {
  if (typeof result.data === 'object' && result.data?.message) return result.data.message
  return fallback
}

async function loadGamesAndRules() {
  const [gamesResult, rulesResult] = await Promise.all([
    apiClient.listGames(),
    apiClient.getRunRulesCatalog(),
  ])
  if (gamesResult.ok && Array.isArray(gamesResult.data) && gamesResult.data.length) {
    games.value = gamesResult.data
  }
  if (rulesResult.ok && Array.isArray(rulesResult.data?.presets)) {
    presets.value = rulesResult.data.presets
  }
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
    await loadGamesAndRules()
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
    gameId: games.value[0]?.id ?? gameIds.red,
    startDate: todayIsoDate(),
    status: runStatuses.notStarted,
    presetId: 'standard',
  }
  createOpen.value = true
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
    const body = {
      name,
      gameId: Number(form.value.gameId),
      startDate: form.value.startDate,
      status: Number(form.value.status),
    }
    if (selectedPreset.value?.rules) {
      body.rules = selectedPreset.value.rules
    }
    const result = await apiClient.createRun(body)
    if (!result.ok) {
      createError.value = apiMessage(result, `Could not create run (${result.status}).`)
      return
    }
    createOpen.value = false
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
        <p class="lede">Start a Nuzlocke for any mainline game, then fill in the location checklist as you go.</p>
      </div>
      <Button
        label="New run"
        data-test="runs-button-new"
        :disabled="!hasKey"
        @click="openCreate"
      />
    </header>

    <p v-if="loading" class="state" data-test="runs-loading">Loading runs…</p>
    <p v-else-if="error" class="state state--error" role="alert" data-test="runs-error">
      {{ error }}
      <RouterLink v-if="!hasKey" to="/settings" class="inline-link" data-test="runs-link-settings">
        Open Settings
      </RouterLink>
    </p>
    <p v-else-if="isEmpty" class="state" data-test="runs-empty">
      No runs yet. Create one to start tracking a mainline playthrough.
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

    <Dialog
      v-model:visible="createOpen"
      modal
      header="New run"
      data-test="runs-create-dialog"
    >
      <form class="modal__form" @submit.prevent="submitCreate">
        <p class="modal__hint">Pick a game and a rules preset. You can tweak clauses on the run page.</p>

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
        <select
          id="run-game"
          v-model.number="form.gameId"
          class="field__input"
          data-test="run-game-select"
        >
          <optgroup v-for="group in groupedGames" :key="group.generation" :label="group.label">
            <option v-for="game in group.games" :key="game.id" :value="game.id">
              {{ game.label }}
            </option>
          </optgroup>
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

        <fieldset class="preset-fieldset">
          <legend>Rules preset</legend>
          <label class="preset">
            <input v-model="form.presetId" type="radio" value="standard" data-test="run-preset-standard" />
            Standard
          </label>
          <label class="preset">
            <input v-model="form.presetId" type="radio" value="hardcore" data-test="run-preset-hardcore" />
            Hardcore
          </label>
        </fieldset>

        <p v-if="createError" class="state state--error" role="alert" data-test="runs-create-error">
          {{ createError }}
        </p>

        <div class="modal__actions">
          <Button
            type="button"
            label="Cancel"
            severity="secondary"
            data-test="runs-create-cancel"
            @click="createOpen = false"
          />
          <Button
            type="submit"
            label="Create run"
            data-test="runs-create-submit"
            :loading="creating"
          />
        </div>
      </form>
    </Dialog>
  </main>
</template>

<style scoped>
.runs {
  max-width: 44rem;
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

.modal__form {
  display: grid;
}

.modal__hint {
  margin: 0 0 0.75rem;
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

.preset-fieldset {
  margin: 1rem 0 0;
  padding: 0.65rem 0.75rem;
  border: 1px solid #eee;
  border-radius: 0.5rem;
  display: flex;
  gap: 1rem;
}

.preset {
  display: inline-flex;
  gap: 0.35rem;
  align-items: center;
  font-size: 0.9rem;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
</style>
