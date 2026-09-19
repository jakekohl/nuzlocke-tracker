<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useApiKeyStore } from '@/stores/apiKey'
import { apiClient } from '@/services/ApiClient'
import { formatGame, generationForGame } from '@/constants/games'
import { formatRunStatus, runStatusOptions, runStatuses } from '@/constants/runStatuses'
import { encounterStatuses } from '@/constants/encounterStatuses'
import { formatUnixDate, todayIsoDate } from '@/lib/dates'
import { shouldWarnDupes } from '@/lib/dupes'
import RunStatsStrip from '@/components/RunStatsStrip.vue'
import LocationChecklist from '@/components/LocationChecklist.vue'
import PokemonRoster from '@/components/PokemonRoster.vue'
import RulesEditor from '@/components/RulesEditor.vue'
import EncounterDialog from '@/components/EncounterDialog.vue'

const route = useRoute()
const router = useRouter()
const apiKeyStore = useApiKeyStore()

const run = ref(null)
const ruleCatalog = ref([])
const rulePresets = ref([])
const encounters = ref([])
const pokemonOptions = ref([])
const routeOptions = ref([])

const loading = ref(false)
const error = ref('')
const actionError = ref('')
const savingDetails = ref(false)
const savingRules = ref(false)
const deleting = ref(false)
const addingEncounter = ref(false)
const activeTab = ref('locations')
const tabs = [
  { id: 'locations', label: 'Locations', test: 'run-tab-locations' },
  { id: 'team', label: 'Team', test: 'run-tab-team' },
  { id: 'box', label: 'Box', test: 'run-tab-box' },
  { id: 'graveyard', label: 'Graveyard', test: 'run-tab-graveyard' },
  { id: 'rules', label: 'Rules', test: 'run-tab-rules' },
  { id: 'details', label: 'Details', test: 'run-tab-details' },
]
const encounterDialogOpen = ref(false)
const loggingRoute = ref(null)

const editDetails = ref({ name: '', status: runStatuses.notStarted, notes: '', startDate: '' })
const editRules = ref({})
const encounterForm = ref(blankEncounterForm())

const runId = computed(() => route.params.id)
const hasKey = computed(() => apiKeyStore.isConfigured)

const pokemonById = computed(() => new Map(pokemonOptions.value.map((p) => [p.id, p])))
const routeById = computed(() => new Map(routeOptions.value.map((r) => [r.id, r])))
const encountersByRouteId = computed(() => {
  const map = new Map()
  for (const encounter of encounters.value) {
    map.set(encounter.routeId, encounter)
  }
  return map
})

const remainingLocations = computed(
  () => routeOptions.value.filter((area) => !encountersByRouteId.value.has(area.id)).length,
)
const aliveCount = computed(
  () => encounters.value.filter((e) => e.status === encounterStatuses.alive).length,
)
const boxedCount = computed(
  () => encounters.value.filter((e) => e.status === encounterStatuses.boxed).length,
)
const deadCount = computed(
  () => encounters.value.filter((e) => e.status === encounterStatuses.dead).length,
)
const missedCount = computed(
  () =>
    encounters.value.filter(
      (e) => e.status === encounterStatuses.failed || e.status === encounterStatuses.skipped,
    ).length,
)

const dupesWarning = computed(() => {
  const pokemon = pokemonById.value.get(Number(encounterForm.value.pokemonId))
  return shouldWarnDupes({
    rules: run.value?.rules,
    isShiny: encounterForm.value.isShiny,
    pokemon,
    encounters: encounters.value,
    pokemonById: pokemonById.value,
  })
})

function blankEncounterForm() {
  return {
    pokemonId: '',
    nickname: '',
    status: encounterStatuses.alive,
    isShiny: false,
    level: '',
    notes: '',
  }
}

function apiMessage(result, fallback) {
  if (typeof result.data === 'object' && result.data?.message) return result.data.message
  return fallback
}

function unixToDateInput(value) {
  if (value == null || value === '') return todayIsoDate()
  const n = Number(value)
  const ms = n > 1e12 ? n : n * 1000
  const d = new Date(ms)
  if (Number.isNaN(d.getTime())) return todayIsoDate()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

function syncEditorsFromRun(next) {
  editDetails.value = {
    name: next.name ?? '',
    status: Number(next.status),
    notes: next.notes ?? '',
    startDate: unixToDateInput(next.startDate),
  }
  editRules.value = { ...(next.rules ?? {}) }
}

function routeLabel(id) {
  return routeById.value.get(Number(id))?.name ?? `Route ${id}`
}

async function loadCatalogs(gameId) {
  const generation = generationForGame(gameId)
  const [pokemonResult, routesResult] = await Promise.all([
    apiClient.listPokemon({ maxGeneration: generation }),
    apiClient.listRoutes({ gameId }),
  ])
  if (pokemonResult.ok && Array.isArray(pokemonResult.data)) {
    pokemonOptions.value = pokemonResult.data
  }
  if (routesResult.ok && Array.isArray(routesResult.data)) {
    routeOptions.value = routesResult.data
  }
}

async function loadRun() {
  error.value = ''
  actionError.value = ''
  run.value = null
  encounters.value = []

  if (!hasKey.value) {
    error.value = 'Set an access key in Settings before viewing a run.'
    return
  }

  loading.value = true
  try {
    const [runResult, rulesResult, encountersResult] = await Promise.all([
      apiClient.getRun(runId.value),
      apiClient.getRunRulesCatalog(),
      apiClient.listEncounters(runId.value),
    ])

    if (!runResult.ok) {
      error.value =
        runResult.status === 404
          ? 'Run not found.'
          : runResult.status === 401
            ? 'Access key was rejected. Update it in Settings.'
            : apiMessage(runResult, `Could not load run (${runResult.status}).`)
      return
    }

    run.value = runResult.data
    syncEditorsFromRun(runResult.data)

    if (rulesResult.ok && Array.isArray(rulesResult.data?.rules)) {
      ruleCatalog.value = rulesResult.data.rules
    }
    if (rulesResult.ok && Array.isArray(rulesResult.data?.presets)) {
      rulePresets.value = rulesResult.data.presets
    }
    if (encountersResult.ok && Array.isArray(encountersResult.data)) {
      encounters.value = encountersResult.data
    } else if (!encountersResult.ok) {
      actionError.value = apiMessage(
        encountersResult,
        `Could not load encounters (${encountersResult.status}).`,
      )
    }

    await loadCatalogs(runResult.data.gameId)
  } catch (err) {
    const detail = err instanceof Error ? err.message : ''
    error.value = detail
      ? `Could not reach the API (${detail}).`
      : 'Could not reach the API. Check VITE_API_BASE_URL and that the backend is running.'
  } finally {
    loading.value = false
  }
}

async function saveDetails() {
  actionError.value = ''
  const name = editDetails.value.name.trim()
  if (!name) {
    actionError.value = 'Name is required.'
    return
  }

  savingDetails.value = true
  try {
    const result = await apiClient.updateRun(runId.value, {
      name,
      status: Number(editDetails.value.status),
      notes: editDetails.value.notes,
      startDate: editDetails.value.startDate,
    })
    if (!result.ok) {
      actionError.value = apiMessage(result, `Could not save run (${result.status}).`)
      return
    }
    run.value = result.data
    syncEditorsFromRun(result.data)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Could not save run.'
  } finally {
    savingDetails.value = false
  }
}

async function saveRules() {
  actionError.value = ''
  savingRules.value = true
  try {
    const result = await apiClient.updateRun(runId.value, { rules: { ...editRules.value } })
    if (!result.ok) {
      actionError.value = apiMessage(result, `Could not save rules (${result.status}).`)
      return
    }
    run.value = result.data
    syncEditorsFromRun(result.data)
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Could not save rules.'
  } finally {
    savingRules.value = false
  }
}

function applyPreset(id) {
  const preset = rulePresets.value.find((item) => item.id === id)
  if (preset?.rules) {
    editRules.value = { ...preset.rules }
    return
  }
  if (id === 'hardcore') {
    editRules.value = {
      ...editRules.value,
      setMode: true,
      levelCap: true,
      noItemsInBattle: true,
      noHeldItems: true,
      blackoutIsFailure: true,
    }
  }
}

async function archiveRun() {
  actionError.value = ''
  const ok = window.confirm(
    'Archive this run? It will be soft-deleted and hidden from your runs list.',
  )
  if (!ok) return

  deleting.value = true
  try {
    const result = await apiClient.deleteRun(runId.value)
    if (!result.ok) {
      actionError.value = apiMessage(result, `Could not archive run (${result.status}).`)
      return
    }
    await router.push({ name: 'runs' })
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Could not archive run.'
  } finally {
    deleting.value = false
  }
}

function openEncounterDialog(area) {
  actionError.value = ''
  loggingRoute.value = area
  encounterForm.value = blankEncounterForm()
  encounterDialogOpen.value = true
}

async function submitEncounter() {
  actionError.value = ''
  if (!loggingRoute.value) return

  const body = {
    routeId: Number(loggingRoute.value.id),
    status: Number(encounterForm.value.status),
    nickname: encounterForm.value.nickname.trim(),
    isShiny: Boolean(encounterForm.value.isShiny),
    notes: encounterForm.value.notes,
  }

  const needsSpecies =
    body.status !== encounterStatuses.failed && body.status !== encounterStatuses.skipped
  if (needsSpecies) {
    if (!encounterForm.value.pokemonId) {
      actionError.value = 'Pick a Pokémon (or mark the encounter as missed / skipped).'
      return
    }
    body.pokemonId = Number(encounterForm.value.pokemonId)
  } else if (encounterForm.value.pokemonId) {
    body.pokemonId = Number(encounterForm.value.pokemonId)
  }

  if (encounterForm.value.level !== '' && encounterForm.value.level != null) {
    body.level = Number(encounterForm.value.level)
  }

  addingEncounter.value = true
  try {
    const result = await apiClient.createEncounter(runId.value, body)
    if (!result.ok) {
      actionError.value = apiMessage(result, `Could not log encounter (${result.status}).`)
      return
    }
    const saved = result.data
    encounters.value = [...encounters.value, saved].sort(
      (a, b) => a.caughtAt - b.caughtAt || a.id - b.id,
    )
    if (Array.isArray(saved.warnings) && saved.warnings.includes('dupesClause')) {
      actionError.value = 'Saved with a dupes-clause warning — this line is already on the run.'
    }
    encounterDialogOpen.value = false
  } catch (err) {
    actionError.value = err instanceof Error ? err.message : 'Could not log encounter.'
  } finally {
    addingEncounter.value = false
  }
}

async function setEncounterStatus(encounter, status) {
  actionError.value = ''
  const result = await apiClient.updateEncounter(runId.value, encounter.id, { status: Number(status) })
  if (!result.ok) {
    actionError.value = apiMessage(result, `Could not update encounter (${result.status}).`)
    return
  }
  encounters.value = encounters.value.map((row) => (row.id === result.data.id ? result.data : row))
}

async function removeEncounter(encounter) {
  const ok = window.confirm(`Remove encounter on ${routeLabel(encounter.routeId)}?`)
  if (!ok) return
  actionError.value = ''
  const result = await apiClient.deleteEncounter(runId.value, encounter.id)
  if (!result.ok) {
    actionError.value = apiMessage(result, `Could not remove encounter (${result.status}).`)
    return
  }
  encounters.value = encounters.value.filter((row) => row.id !== encounter.id)
}

onMounted(loadRun)
watch(runId, loadRun)
</script>

<template>
  <main class="run-detail" data-test="run-detail-page">
    <p class="back">
      <RouterLink to="/runs" data-test="run-detail-back">← All runs</RouterLink>
    </p>

    <p v-if="loading" class="state" data-test="run-detail-loading">Loading run…</p>
    <p v-else-if="error" class="state state--error" role="alert" data-test="run-detail-error">
      {{ error }}
      <RouterLink v-if="!hasKey" to="/settings" class="inline-link" data-test="run-detail-link-settings">
        Open Settings
      </RouterLink>
    </p>

    <template v-else-if="run">
      <header class="hero" data-test="run-detail-header">
        <div class="hero__text">
          <p class="eyebrow">{{ formatGame(run.gameId) }}</p>
          <h1 data-test="run-detail-name">{{ run.name }}</h1>
          <div class="hero__meta">
            <span class="pill pill--status" data-test="run-detail-status">
              {{ formatRunStatus(run.status) }}
            </span>
            <span class="muted">Started {{ formatUnixDate(run.startDate) }}</span>
          </div>
        </div>
        <Button
          label="Archive run"
          severity="danger"
          outlined
          data-test="run-button-archive"
          :loading="deleting"
          @click="archiveRun"
        />
      </header>

      <p v-if="actionError" class="state state--error" role="alert" data-test="run-detail-action-error">
        {{ actionError }}
      </p>

      <RunStatsStrip
        :remaining="remainingLocations"
        :alive="aliveCount"
        :boxed="boxedCount"
        :dead="deadCount"
        :missed="missedCount"
      />

      <div class="tab-bar" data-test="run-tabs" role="tablist">
        <button
          v-for="tab in tabs"
          :key="tab.id"
          type="button"
          class="tab-bar__btn"
          :class="{ 'tab-bar__btn--on': activeTab === tab.id }"
          :data-test="tab.test"
          role="tab"
          :aria-selected="activeTab === tab.id"
          @click="activeTab = tab.id"
        >
          {{ tab.label }}
        </button>
      </div>

      <LocationChecklist
        v-if="activeTab === 'locations'"
        :routes="routeOptions"
        :encounters-by-route-id="encountersByRouteId"
        :pokemon-by-id="pokemonById"
        @log="openEncounterDialog"
        @status="setEncounterStatus"
        @remove="removeEncounter"
      />
      <PokemonRoster
        v-else-if="activeTab === 'team'"
        :encounters="encounters"
        :pokemon-by-id="pokemonById"
        :route-by-id="routeById"
        :status-filter="encounterStatuses.alive"
        @status="setEncounterStatus"
        @remove="removeEncounter"
      />
      <PokemonRoster
        v-else-if="activeTab === 'box'"
        :encounters="encounters"
        :pokemon-by-id="pokemonById"
        :route-by-id="routeById"
        :status-filter="encounterStatuses.boxed"
        @status="setEncounterStatus"
        @remove="removeEncounter"
      />
      <PokemonRoster
        v-else-if="activeTab === 'graveyard'"
        :encounters="encounters"
        :pokemon-by-id="pokemonById"
        :route-by-id="routeById"
        :status-filter="encounterStatuses.dead"
        @status="setEncounterStatus"
        @remove="removeEncounter"
      />
      <RulesEditor
        v-else-if="activeTab === 'rules'"
        v-model="editRules"
        :catalog="ruleCatalog"
        :saving="savingRules"
        @save="saveRules"
        @preset="applyPreset"
      />
      <section v-else-if="activeTab === 'details'" class="panel" aria-labelledby="details-heading">
        <div class="section__head">
          <h2 id="details-heading">Details</h2>
          <Button
            label="Save"
            data-test="run-button-save-details"
            :loading="savingDetails"
            @click="saveDetails"
          />
        </div>
        <div class="details-grid">
          <div class="field-block">
            <label class="field" for="edit-name">Name</label>
            <input id="edit-name" v-model="editDetails.name" class="field__input" data-test="run-edit-name" />
          </div>
          <div class="field-block">
            <label class="field" for="edit-status">Status</label>
            <Select
              input-id="edit-status"
              v-model="editDetails.status"
              :options="runStatusOptions"
              option-label="label"
              option-value="value"
              data-test="run-edit-status"
            />
          </div>
          <div class="field-block">
            <label class="field" for="edit-start">Start date</label>
            <input
              id="edit-start"
              v-model="editDetails.startDate"
              type="date"
              class="field__input"
              data-test="run-edit-start"
            />
          </div>
          <div class="field-block field-block--full">
            <label class="field" for="edit-notes">Notes</label>
            <textarea
              id="edit-notes"
              v-model="editDetails.notes"
              class="field__input"
              rows="4"
              data-test="run-edit-notes"
            />
          </div>
        </div>
      </section>

      <EncounterDialog
        v-model:visible="encounterDialogOpen"
        :route="loggingRoute"
        :form="encounterForm"
        :pokemon-options="pokemonOptions"
        :saving="addingEncounter"
        :nickname-required="Boolean(run.rules?.nicknameRequired)"
        :dupes-warning="dupesWarning"
        @submit="submitEncounter"
      />
    </template>
  </main>
</template>

<style scoped>
.run-detail {
  max-width: 64rem;
  margin: 2rem auto;
  padding: 0 1rem 3rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.back {
  margin: 0 0 1.25rem;
}

.back a {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.state {
  margin: 0 0 1rem;
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
  margin-left: 0.35rem;
  color: #1565c0;
}

.hero {
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1.25rem;
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.03em;
  text-transform: uppercase;
  color: #1976d2;
}

.hero h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.75rem, 4vw, 2.25rem);
  line-height: 1.2;
}

.hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
  font-size: 0.9rem;
}

.pill {
  display: inline-block;
  padding: 0.15rem 0.55rem;
  border-radius: 999px;
  font-weight: 500;
}

.pill--status {
  background: #f3e5f5;
  color: #6a1b9a;
}

.tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.25rem;
  margin: 0 0 1rem;
  border-bottom: 1px solid #e6e6e6;
}

.tab-bar__btn {
  padding: 0.55rem 0.85rem;
  border: none;
  border-bottom: 2px solid transparent;
  background: transparent;
  cursor: pointer;
  font: inherit;
  color: #555;
}

.tab-bar__btn--on {
  color: #1565c0;
  border-bottom-color: #1565c0;
  font-weight: 600;
}

.section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.section__head h2 {
  margin: 0;
  font-size: 1.1rem;
}

.details-grid {
  display: grid;
  gap: 0.65rem 0.85rem;
}

@media (min-width: 28rem) {
  .details-grid {
    grid-template-columns: 1fr 1fr;
  }

  .field-block--full {
    grid-column: 1 / -1;
  }
}

.field {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 600;
  font-size: 0.8rem;
}

.details-grid .field__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.65rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  font: inherit;
}
</style>
