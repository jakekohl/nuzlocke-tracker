<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { useApiKeyStore } from '@/stores/apiKey'
import { apiClient } from '@/services/ApiClient'
import { formatGame } from '@/constants/games'
import { formatRunStatus, runStatusOptions, runStatuses } from '@/constants/runStatuses'
import {
  encounterStatuses,
  encounterStatusOptions,
  formatEncounterStatus,
} from '@/constants/encounterStatuses'
import { formatUnixDate, todayIsoDate } from '@/lib/dates'

const route = useRoute()
const router = useRouter()
const apiKeyStore = useApiKeyStore()

const run = ref(null)
const ruleCatalog = ref([])
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

const editDetails = ref({ name: '', status: runStatuses.notStarted, notes: '', startDate: '' })
const editRules = ref({})
const encounterForm = ref(blankEncounterForm())
const encounterDialog = ref(null)

const runId = computed(() => route.params.id)
const hasKey = computed(() => apiKeyStore.isConfigured)

const pokemonById = computed(() => new Map(pokemonOptions.value.map((p) => [p.id, p])))
const routeById = computed(() => new Map(routeOptions.value.map((r) => [r.id, r])))

const sortedRules = computed(() =>
  [...ruleCatalog.value].sort((a, b) => {
    const order = { core: 0, optional: 1, hardcore: 2, softener: 3 }
    return (order[a.category] ?? 9) - (order[b.category] ?? 9) || a.label.localeCompare(b.label)
  }),
)

const RULE_CATEGORY_LABELS = {
  core: 'Core',
  optional: 'Optional',
  hardcore: 'Hardcore',
  softener: 'Softeners',
}

const rulesByCategory = computed(() => {
  const groups = []
  const byKey = new Map()
  for (const rule of sortedRules.value) {
    const category = rule.category || 'other'
    if (!byKey.has(category)) {
      const group = {
        category,
        label: RULE_CATEGORY_LABELS[category] ?? category,
        rules: [],
      }
      byKey.set(category, group)
      groups.push(group)
    }
    byKey.get(category).rules.push(rule)
  }
  return groups
})

const enabledRuleCount = computed(
  () => Object.values(editRules.value).filter((value) => value === true).length,
)

const usedRouteIds = computed(() => new Set(encounters.value.map((e) => e.routeId)))

const availableRoutes = computed(() =>
  routeOptions.value.filter(
    (r) => !usedRouteIds.value.has(r.id) || Number(encounterForm.value.routeId) === r.id,
  ),
)

function blankEncounterForm() {
  return {
    routeId: '',
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

function pokemonLabel(id) {
  const p = pokemonById.value.get(Number(id))
  return p ? `#${p.id} ${p.name}` : id != null ? `#${id}` : '—'
}

function routeLabel(id) {
  const r = routeById.value.get(Number(id))
  return r ? r.name : `Route ${id}`
}

async function loadCatalogs(gameId) {
  const [pokemonResult, routesResult] = await Promise.all([
    apiClient.listPokemon({ generation: 1 }),
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

function openEncounterDialog() {
  actionError.value = ''
  encounterForm.value = blankEncounterForm()
  if (availableRoutes.value.length) {
    encounterForm.value.routeId = availableRoutes.value[0].id
  }
  encounterDialog.value?.showModal()
}

function closeEncounterDialog() {
  encounterDialog.value?.close()
}

async function submitEncounter() {
  actionError.value = ''
  const body = {
    routeId: Number(encounterForm.value.routeId),
    status: Number(encounterForm.value.status),
    nickname: encounterForm.value.nickname.trim(),
    isShiny: Boolean(encounterForm.value.isShiny),
    notes: encounterForm.value.notes,
  }

  if (body.status !== encounterStatuses.failed) {
    if (!encounterForm.value.pokemonId) {
      actionError.value = 'Pick a Pokémon (or mark the encounter as failed).'
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
    encounters.value = [...encounters.value, result.data].sort(
      (a, b) => a.caughtAt - b.caughtAt || a.id - b.id,
    )
    closeEncounterDialog()
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
        <div class="hero__actions">
          <button
            type="button"
            class="btn btn--danger"
            data-test="run-button-archive"
            :disabled="deleting"
            @click="archiveRun"
          >
            {{ deleting ? 'Archiving…' : 'Archive run' }}
          </button>
        </div>
      </header>

      <p v-if="actionError" class="state state--error" role="alert" data-test="run-detail-action-error">
        {{ actionError }}
      </p>

      <div class="panels">
        <section class="panel" aria-labelledby="details-heading">
          <div class="section__head">
            <h2 id="details-heading">Details</h2>
            <button
              type="button"
              class="btn btn--primary"
              data-test="run-button-save-details"
              :disabled="savingDetails"
              @click="saveDetails"
            >
              {{ savingDetails ? 'Saving…' : 'Save' }}
            </button>
          </div>

          <div class="details-grid">
            <div class="field-block">
              <label class="field" for="edit-name">Name</label>
              <input
                id="edit-name"
                v-model="editDetails.name"
                type="text"
                class="field__input"
                data-test="run-edit-name"
              />
            </div>

            <div class="field-block">
              <label class="field" for="edit-status">Status</label>
              <select
                id="edit-status"
                v-model.number="editDetails.status"
                class="field__input"
                data-test="run-edit-status"
              >
                <option v-for="opt in runStatusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
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
                class="field__input field__textarea"
                rows="4"
                data-test="run-edit-notes"
              />
            </div>
          </div>
        </section>

        <section class="panel" aria-labelledby="rules-heading">
          <div class="section__head">
            <div>
              <h2 id="rules-heading">Rules</h2>
              <p class="section-lede">{{ enabledRuleCount }} enabled · hover a rule for details</p>
            </div>
            <button
              type="button"
              class="btn btn--primary"
              data-test="run-button-save-rules"
              :disabled="savingRules"
              @click="saveRules"
            >
              {{ savingRules ? 'Saving…' : 'Save' }}
            </button>
          </div>

          <div class="rules-compact" data-test="run-detail-rules-edit">
            <div v-for="group in rulesByCategory" :key="group.category" class="rules-group">
              <h3 class="rules-group__title">{{ group.label }}</h3>
              <ul class="rule-chip-list">
                <li v-for="rule in group.rules" :key="rule.key">
                  <label
                    class="rule-chip"
                    :class="{ 'rule-chip--on': editRules[rule.key] }"
                    :title="rule.description"
                  >
                    <input
                      v-model="editRules[rule.key]"
                      type="checkbox"
                      :data-test="`run-rule-${rule.key}`"
                    />
                    <span>{{ rule.label }}</span>
                  </label>
                </li>
              </ul>
            </div>
          </div>
        </section>
      </div>

      <section class="panel panel--encounters" aria-labelledby="encounters-heading">
        <div class="section__head">
          <div>
            <h2 id="encounters-heading">Encounters</h2>
            <p class="section-lede">Log catches, gifts, and failed first encounters.</p>
          </div>
          <button
            type="button"
            class="btn btn--primary"
            data-test="run-button-add-encounter"
            @click="openEncounterDialog"
          >
            Log encounter
          </button>
        </div>

        <p v-if="!encounters.length" class="muted" data-test="run-encounters-empty">
          No encounters logged yet.
        </p>
        <ul v-else class="encounter-list" data-test="run-encounters-list">
          <li
            v-for="encounter in encounters"
            :key="encounter.id"
            class="encounter-row"
            :data-test="`encounter-row-${encounter.id}`"
          >
            <div class="encounter-row__main">
              <span class="encounter-row__title">
                <template v-if="encounter.status === encounterStatuses.failed">
                  Missed — {{ routeLabel(encounter.routeId) }}
                </template>
                <template v-else>
                  {{ encounter.nickname || pokemonLabel(encounter.pokemonId) }}
                  <span class="muted">
                    ({{ pokemonLabel(encounter.pokemonId) }})
                  </span>
                </template>
              </span>
              <span class="encounter-row__meta">
                {{ routeLabel(encounter.routeId) }}
                ·
                <span :data-test="`encounter-status-${encounter.id}`">
                  {{ formatEncounterStatus(encounter.status) }}
                </span>
                <span v-if="encounter.isShiny"> · Shiny</span>
              </span>
            </div>
            <div class="encounter-row__actions">
              <select
                class="field__input field__input--compact"
                :value="encounter.status"
                :data-test="`encounter-status-select-${encounter.id}`"
                @change="setEncounterStatus(encounter, $event.target.value)"
              >
                <option v-for="opt in encounterStatusOptions" :key="opt.value" :value="opt.value">
                  {{ opt.label }}
                </option>
              </select>
              <button
                type="button"
                class="btn"
                :data-test="`encounter-delete-${encounter.id}`"
                @click="removeEncounter(encounter)"
              >
                Remove
              </button>
            </div>
          </li>
        </ul>
      </section>

      <dialog
        ref="encounterDialog"
        class="modal"
        data-test="encounter-dialog"
        @cancel.prevent="closeEncounterDialog"
      >
        <form class="modal__form" @submit.prevent="submitEncounter">
          <h2>Log encounter</h2>

          <label class="field" for="enc-route">Route / area</label>
          <select
            id="enc-route"
            v-model.number="encounterForm.routeId"
            class="field__input"
            data-test="encounter-route-select"
            required
          >
            <option disabled value="">Select area</option>
            <option v-for="area in availableRoutes" :key="area.id" :value="area.id">
              {{ area.name }}
            </option>
          </select>

          <label class="field" for="enc-status">Outcome</label>
          <select
            id="enc-status"
            v-model.number="encounterForm.status"
            class="field__input"
            data-test="encounter-outcome-select"
          >
            <option v-for="opt in encounterStatusOptions" :key="opt.value" :value="opt.value">
              {{ opt.label }}
            </option>
          </select>

          <label class="field" for="enc-pokemon">Pokémon</label>
          <select
            id="enc-pokemon"
            v-model="encounterForm.pokemonId"
            class="field__input"
            data-test="encounter-pokemon-select"
            :required="encounterForm.status !== encounterStatuses.failed"
          >
            <option value="">
              {{ encounterForm.status === encounterStatuses.failed ? 'Unknown / skip' : 'Select species' }}
            </option>
            <option v-for="poke in pokemonOptions" :key="poke.id" :value="poke.id">
              #{{ poke.id }} {{ poke.name }}
            </option>
          </select>

          <label class="field" for="enc-nickname">Nickname</label>
          <input
            id="enc-nickname"
            v-model="encounterForm.nickname"
            type="text"
            class="field__input"
            data-test="encounter-nickname-input"
            :required="
              run.rules?.nicknameRequired && encounterForm.status !== encounterStatuses.failed
            "
          />

          <label class="field field--inline">
            <input v-model="encounterForm.isShiny" type="checkbox" data-test="encounter-shiny" />
            Shiny
          </label>

          <label class="field" for="enc-level">Level (optional)</label>
          <input
            id="enc-level"
            v-model="encounterForm.level"
            type="number"
            min="1"
            max="100"
            class="field__input"
            data-test="encounter-level-input"
          />

          <label class="field" for="enc-notes">Notes</label>
          <textarea
            id="enc-notes"
            v-model="encounterForm.notes"
            class="field__input field__textarea"
            rows="2"
            data-test="encounter-notes-input"
          />

          <div class="modal__actions">
            <button type="button" class="btn" data-test="encounter-cancel" @click="closeEncounterDialog">
              Cancel
            </button>
            <button
              type="submit"
              class="btn btn--primary"
              data-test="encounter-submit"
              :disabled="addingEncounter"
            >
              {{ addingEncounter ? 'Saving…' : 'Save encounter' }}
            </button>
          </div>
        </form>
      </dialog>
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

.hero__actions {
  display: flex;
  gap: 0.5rem;
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

.muted {
  color: #666;
}

.panels {
  display: grid;
  gap: 1rem;
  margin-bottom: 1rem;
}

@media (min-width: 52rem) {
  .panels {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1.15fr);
    align-items: start;
  }
}

.panel {
  padding: 1rem 1.1rem 1.15rem;
  border: 1px solid #e6e6e6;
  border-radius: 0.65rem;
  background: #fff;
}

.panel--encounters {
  margin-bottom: 1rem;
}

.section__head {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 1rem;
  margin-bottom: 0.85rem;
}

.section__head h2 {
  margin: 0 0 0.2rem;
  font-size: 1.1rem;
}

.section-lede {
  margin: 0;
  font-size: 0.8rem;
  color: #666;
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

.field-block .field {
  margin-top: 0;
}

.field {
  display: block;
  margin: 0.75rem 0 0.375rem;
  font-weight: 600;
  font-size: 0.8rem;
}

.field--inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.field__input {
  width: 100%;
  box-sizing: border-box;
  padding: 0.45rem 0.65rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  font: inherit;
}

.field__input--compact {
  width: auto;
  min-width: 8rem;
}

.field__textarea {
  resize: vertical;
}

.btn {
  padding: 0.45rem 0.85rem;
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

.btn--danger {
  border-color: #c62828;
  color: #c62828;
}

.btn--danger:hover:not(:disabled) {
  background: #ffebee;
}

.rules-compact {
  display: grid;
  gap: 0.85rem;
}

.rules-group__title {
  margin: 0 0 0.4rem;
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #777;
}

.rule-chip-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: flex;
  flex-wrap: wrap;
  gap: 0.4rem;
}

.rule-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.35rem;
  padding: 0.28rem 0.55rem;
  border: 1px solid #ddd;
  border-radius: 999px;
  background: #f7f7f7;
  font-size: 0.8rem;
  cursor: pointer;
  user-select: none;
}

.rule-chip input {
  margin: 0;
}

.rule-chip--on {
  border-color: #90caf9;
  background: #e3f2fd;
  color: #0d47a1;
}

.encounter-list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.encounter-row {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  justify-content: space-between;
  align-items: center;
  padding: 0.85rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
}

.encounter-row__title {
  display: block;
  font-weight: 600;
}

.encounter-row__meta {
  display: block;
  margin-top: 0.25rem;
  font-size: 0.85rem;
  color: #555;
}

.encounter-row__actions {
  display: flex;
  gap: 0.5rem;
  align-items: center;
}

.modal {
  width: min(100% - 2rem, 26rem);
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
  margin: 0 0 0.75rem;
  font-size: 1.25rem;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.25rem;
}
</style>
