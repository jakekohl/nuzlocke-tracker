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
import { runStatusSeverity } from '@/lib/statusUi'
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
const partyFilter = ref(encounterStatuses.alive)
const tabs = [
  { id: 'locations', label: 'Locations', test: 'run-tab-locations' },
  { id: 'party', label: 'Party', test: 'run-tab-party' },
  { id: 'rules', label: 'Rules', test: 'run-tab-rules' },
  { id: 'details', label: 'Details', test: 'run-tab-details' },
]
const partyFilters = [
  { id: 'team', label: 'Alive', status: encounterStatuses.alive, test: 'run-tab-team' },
  { id: 'box', label: 'Boxed', status: encounterStatuses.boxed, test: 'run-tab-box' },
  { id: 'graveyard', label: 'Dead', status: encounterStatuses.dead, test: 'run-tab-graveyard' },
]
const encounterDialogOpen = ref(false)
const loggingRoute = ref(null)

function openPartyFilter(status) {
  activeTab.value = 'party'
  partyFilter.value = status
}

function onStatSelect(key) {
  if (key === 'locations' || key === 'missed') {
    activeTab.value = 'locations'
    return
  }
  if (key === 'team') openPartyFilter(encounterStatuses.alive)
  else if (key === 'box') openPartyFilter(encounterStatuses.boxed)
  else if (key === 'graveyard') openPartyFilter(encounterStatuses.dead)
}

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
  editRules.value = { ...next.rules }
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
  <main class="run-detail page" data-test="run-detail-page">
    <p class="back">
      <RouterLink to="/runs" data-test="run-detail-back">← All runs</RouterLink>
    </p>

    <p v-if="loading" class="state-box" data-test="run-detail-loading">Loading run…</p>
    <p v-else-if="error" class="state-box state-box--error" role="alert" data-test="run-detail-error">
      {{ error }}
      <RouterLink
        v-if="!hasKey"
        to="/settings"
        class="inline-link"
        data-test="run-detail-link-settings"
      >
        Open Settings
      </RouterLink>
    </p>

    <template v-else-if="run">
      <header class="hero surface" data-test="run-detail-header">
        <div class="hero__text">
          <p class="eyebrow">{{ formatGame(run.gameId) }}</p>
          <h1 data-test="run-detail-name">{{ run.name }}</h1>
          <div class="hero__meta">
            <Tag
              :value="formatRunStatus(run.status)"
              :severity="runStatusSeverity(run.status)"
              rounded
              data-test="run-detail-status"
            />
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

      <p
        v-if="actionError"
        class="state-box state-box--error"
        role="alert"
        data-test="run-detail-action-error"
      >
        {{ actionError }}
      </p>

      <RunStatsStrip
        :remaining="remainingLocations"
        :alive="aliveCount"
        :boxed="boxedCount"
        :dead="deadCount"
        :missed="missedCount"
        @select="onStatSelect"
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

      <section v-else-if="activeTab === 'party'" class="party-panel" data-test="run-party">
        <div class="party-filters" role="group" aria-label="Party filter">
          <button
            v-for="filter in partyFilters"
            :key="filter.id"
            type="button"
            class="party-filters__btn"
            :class="{ 'party-filters__btn--on': partyFilter === filter.status }"
            :data-test="filter.test"
            @click="openPartyFilter(filter.status)"
          >
            {{ filter.label }}
          </button>
        </div>
        <PokemonRoster
          :encounters="encounters"
          :pokemon-by-id="pokemonById"
          :route-by-id="routeById"
          :status-filter="partyFilter"
          @status="setEncounterStatus"
          @remove="removeEncounter"
        />
      </section>

      <RulesEditor
        v-else-if="activeTab === 'rules'"
        v-model="editRules"
        :catalog="ruleCatalog"
        :saving="savingRules"
        @save="saveRules"
        @preset="applyPreset"
      />

      <section v-else-if="activeTab === 'details'" class="panel surface" aria-labelledby="details-heading">
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
            <label class="field-label" for="edit-name">Name</label>
            <InputText id="edit-name" v-model="editDetails.name" class="w-full" data-test="run-edit-name" />
          </div>
          <div class="field-block">
            <label class="field-label" for="edit-status">Status</label>
            <Select
              input-id="edit-status"
              v-model="editDetails.status"
              :options="runStatusOptions"
              option-label="label"
              option-value="value"
              class="w-full"
              data-test="run-edit-status"
            />
          </div>
          <div class="field-block">
            <label class="field-label" for="edit-start">Start date</label>
            <input
              id="edit-start"
              v-model="editDetails.startDate"
              type="date"
              class="native-input"
              data-test="run-edit-start"
            />
          </div>
          <div class="field-block field-block--full">
            <label class="field-label" for="edit-notes">Notes</label>
            <Textarea
              id="edit-notes"
              v-model="editDetails.notes"
              class="w-full"
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
.back {
  margin: 0 0 1rem;
}

.back a {
  color: var(--color-primary-strong);
  text-decoration: none;
  font-weight: 600;
}

.inline-link {
  margin-left: 0.35rem;
  color: var(--color-primary-strong);
  font-weight: 600;
}

.hero {
  position: sticky;
  top: calc(var(--nav-height) + 0.25rem);
  z-index: 5;
  display: flex;
  flex-wrap: wrap;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 1rem;
  padding: 1rem 1.15rem;
  backdrop-filter: blur(10px);
  background: rgb(251 252 249 / 92%);
}

.eyebrow {
  margin: 0 0 0.35rem;
  font-size: 0.8rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary-strong);
}

.hero h1 {
  margin: 0 0 0.5rem;
  font-size: clamp(1.75rem, 4vw, 2.35rem);
  line-height: 1.15;
}

.hero__meta {
  display: flex;
  flex-wrap: wrap;
  gap: 0.65rem;
  align-items: center;
  font-size: 0.9rem;
}

.muted {
  color: var(--color-muted);
}

.tab-bar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0 0 1rem;
  padding: 0.3rem;
  border-radius: var(--radius-pill);
  background: rgb(15 31 26 / 5%);
}

.tab-bar__btn {
  padding: 0.55rem 0.95rem;
  border: none;
  border-radius: var(--radius-pill);
  background: transparent;
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  color: var(--color-muted);
  transition:
    background var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.tab-bar__btn:hover,
.tab-bar__btn:focus-visible {
  background: var(--color-surface-raised);
  color: var(--color-ink);
  outline: none;
}

.tab-bar__btn--on {
  background: var(--color-ink);
  color: #fff;
}

.party-panel {
  display: grid;
  gap: 0.85rem;
}

.party-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.35rem;
  margin: 0 0 0.15rem;
}

.party-filters__btn {
  padding: 0.4rem 0.85rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-pill);
  background: var(--color-surface-raised);
  color: var(--color-muted);
  cursor: pointer;
  font: inherit;
  font-weight: 600;
  font-size: 0.9rem;
}

.party-filters__btn--on {
  border-color: transparent;
  background: var(--color-primary);
  color: #fff;
}

.panel {
  padding: 1.1rem 1.15rem;
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
  font-size: 1.2rem;
}

.details-grid {
  display: grid;
  gap: 0.65rem 0.85rem;
}

.w-full {
  width: 100%;
}

.native-input {
  width: 100%;
  box-sizing: border-box;
  min-height: 2.75rem;
  padding: 0.45rem 0.65rem;
  border: 1px solid var(--color-border-strong);
  border-radius: var(--radius-sm);
  background: var(--color-surface-raised);
  color: var(--color-ink);
  font: inherit;
}

.field-label {
  display: block;
  margin-bottom: 0.35rem;
  font-weight: 600;
  font-size: 0.8rem;
}

@media (min-width: 28rem) {
  .details-grid {
    grid-template-columns: 1fr 1fr;
  }

  .field-block--full {
    grid-column: 1 / -1;
  }
}
</style>
