<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { useApiKeyStore } from '@/stores/apiKey'
import { useCatalogStore } from '@/stores/catalog'
import { apiClient } from '@/services/ApiClient'
import { fallbackGames, formatGame, gameIds } from '@/constants/games'
import { formatRunStatus, runStatuses } from '@/constants/runStatuses'
import { formatUnixDate, todayIsoDate } from '@/lib/dates'
import { gamesGroupedByGeneration } from '@/lib/gamesUi'
import { runStatusSeverity } from '@/lib/statusUi'

const apiKeyStore = useApiKeyStore()
const catalogStore = useCatalogStore()
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

const presetOptions = [
  { label: 'Standard', value: 'standard' },
  { label: 'Hardcore', value: 'hardcore' },
]

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
    catalogStore.ensureGames(),
    catalogStore.ensureRulesCatalog(),
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
  <main class="runs page" data-test="runs-page">
    <header class="page-header">
      <div>
        <h1>Runs</h1>
        <p class="lede">
          Start a Nuzlocke for any mainline game, then fill in the location checklist as you go.
        </p>
      </div>
      <Button
        label="New run"
        data-test="runs-button-new"
        :disabled="!hasKey"
        @click="openCreate"
      />
    </header>

    <p v-if="loading" class="state-box" data-test="runs-loading">Loading runs…</p>
    <p v-else-if="error" class="state-box state-box--error" role="alert" data-test="runs-error">
      {{ error }}
      <RouterLink v-if="!hasKey" to="/settings" class="inline-link" data-test="runs-link-settings">
        Open Settings
      </RouterLink>
    </p>
    <div v-else-if="isEmpty" class="empty-panel" data-test="runs-empty">
      <h2>No runs yet</h2>
      <p class="muted">Create one to start tracking a mainline playthrough.</p>
      <Button label="New run" :disabled="!hasKey" @click="openCreate" />
    </div>

    <ul v-else class="run-list" data-test="runs-list">
      <li v-for="run in runs" :key="run.id" class="run-row surface">
        <RouterLink
          :to="{ name: 'run-detail', params: { id: run.id } }"
          class="run-row__link"
          :data-test="`run-link-${run.id}`"
        >
          <span class="run-row__name">{{ run.name }}</span>
          <span class="run-row__meta">
            <Tag :value="formatGame(run.gameId)" severity="secondary" rounded />
            <Tag
              :value="formatRunStatus(run.status)"
              :severity="runStatusSeverity(run.status)"
              rounded
            />
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
        <p class="field-hint">
          Pick a game and a rules preset. You can tweak clauses on the run page.
        </p>

        <label class="field-label" for="run-name">Name</label>
        <InputText
          id="run-name"
          v-model="form.name"
          class="w-full"
          data-test="run-name-input"
          placeholder="Kanto Red Nuzlocke"
          required
        />

        <label class="field-label" for="run-game">Game</label>
        <select
          id="run-game"
          v-model.number="form.gameId"
          class="native-select"
          data-test="run-game-select"
        >
          <optgroup v-for="group in groupedGames" :key="group.generation" :label="group.label">
            <option v-for="game in group.games" :key="game.id" :value="game.id">
              {{ game.label }}
            </option>
          </optgroup>
        </select>

        <label class="field-label" for="run-start">Start date</label>
        <input
          id="run-start"
          v-model="form.startDate"
          type="date"
          class="native-select"
          data-test="run-start-input"
          required
        />

        <p class="field-label">Rules preset</p>
        <SelectButton
          v-model="form.presetId"
          :options="presetOptions"
          option-label="label"
          option-value="value"
          data-test="run-preset-select"
        />
        <!-- Hidden radios keep Cypress data-test hooks working -->
        <div class="sr-only" aria-hidden="true">
          <input
            v-model="form.presetId"
            type="radio"
            value="standard"
            data-test="run-preset-standard"
          />
          <input
            v-model="form.presetId"
            type="radio"
            value="hardcore"
            data-test="run-preset-hardcore"
          />
        </div>

        <p v-if="createError" class="state-box state-box--error" role="alert" data-test="runs-create-error">
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
.page-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.75rem;
}

.page-header h1 {
  margin: 0 0 0.4rem;
  font-size: clamp(1.75rem, 4vw, 2.35rem);
}

.lede {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.45;
  font-size: 1rem;
  max-width: 36rem;
}

.inline-link {
  display: inline-block;
  margin-left: 0.35rem;
  color: var(--color-primary-strong);
  font-weight: 600;
}

.run-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.run-row {
  overflow: hidden;
  transition:
    transform var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
}

.run-row:hover,
.run-row:focus-within {
  transform: translateY(-2px);
  box-shadow: var(--shadow-lift);
}

.run-row__link {
  display: flex;
  flex-direction: column;
  gap: 0.65rem;
  padding: 1.1rem 1.2rem;
  color: inherit;
  text-decoration: none;
}

.run-row__name {
  font-family: var(--font-display);
  font-weight: 600;
  font-size: 1.2rem;
  color: var(--color-ink);
}

.run-row__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  align-items: center;
  font-size: 0.875rem;
}

.modal__form {
  display: grid;
}

.w-full {
  width: 100%;
}

.native-select {
  width: 100%;
  box-sizing: border-box;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
  color: var(--color-ink);
  font: inherit;
}

.sr-only {
  position: absolute;
  width: 1px;
  height: 1px;
  padding: 0;
  margin: -1px;
  overflow: hidden;
  clip: rect(0, 0, 0, 0);
  white-space: nowrap;
  border: 0;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}

@media (prefers-reduced-motion: reduce) {
  .run-row:hover,
  .run-row:focus-within {
    transform: none;
  }
}
</style>
