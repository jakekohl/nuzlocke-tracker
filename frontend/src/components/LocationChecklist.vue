<script setup>
import { computed, ref } from 'vue'
import PokemonSprite from '@/components/PokemonSprite.vue'
import EncounterTimestamps from '@/components/EncounterTimestamps.vue'
import {
  encounterStatuses,
  encounterStatusOptions,
  formatEncounterStatus,
} from '@/constants/encounterStatuses'
import { encounterStatusSeverity } from '@/lib/statusUi'

const props = defineProps({
  routes: { type: Array, required: true },
  encountersByRouteId: { type: Map, required: true },
  pokemonById: { type: Map, required: true },
})

const emit = defineEmits(['log', 'status', 'remove'])

const query = ref('')
const fillFilter = ref('all')

const fillOptions = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Filled', value: 'filled' },
]

const filteredRoutes = computed(() => {
  const q = query.value.trim().toLowerCase()
  return props.routes.filter((route) => {
    const encounter = props.encountersByRouteId.get(route.id)
    if (fillFilter.value === 'open' && encounter) return false
    if (fillFilter.value === 'filled' && !encounter) return false
    if (!q) return true
    const pokemon = encounter ? props.pokemonById.get(Number(encounter.pokemonId)) : null
    const haystack = [route.name, encounter?.nickname, pokemon?.name, encounter?.notes]
      .filter(Boolean)
      .join(' ')
      .toLowerCase()
    return haystack.includes(q)
  })
})

function pokemonName(id) {
  return props.pokemonById.get(Number(id))?.name ?? (id != null ? `#${id}` : '')
}

function title(encounter) {
  if (!encounter) return ''
  if (encounter.status === encounterStatuses.failed || encounter.status === encounterStatuses.skipped) {
    return formatEncounterStatus(encounter.status)
  }
  return encounter.nickname || pokemonName(encounter.pokemonId)
}

function notes(encounter) {
  return encounter?.notes?.trim?.() || ''
}
</script>

<template>
  <div class="checklist" data-test="run-locations">
    <div class="checklist__toolbar">
      <InputText
        v-model="query"
        placeholder="Search locations or Pokémon"
        data-test="location-search"
      />
      <SelectButton
        v-model="fillFilter"
        :options="fillOptions"
        option-label="label"
        option-value="value"
        data-test="location-filter"
      />
    </div>

    <p v-if="!filteredRoutes.length" class="muted" data-test="run-encounters-empty">
      No locations match this filter.
    </p>
    <ul v-else class="checklist__list" data-test="run-encounters-list">
      <li
        v-for="route in filteredRoutes"
        :key="route.id"
        class="row surface"
        :class="{ 'row--open': !encountersByRouteId.get(route.id) }"
        :data-test="
          encountersByRouteId.get(route.id)
            ? `encounter-row-${encountersByRouteId.get(route.id).id}`
            : `location-row-${route.id}`
        "
      >
        <template v-if="encountersByRouteId.get(route.id)">
          <div class="row__top">
            <PokemonSprite
              :pokemon-id="encountersByRouteId.get(route.id).pokemonId"
              :name="pokemonName(encountersByRouteId.get(route.id).pokemonId)"
              :shiny="encountersByRouteId.get(route.id).isShiny"
              size="lg"
            />
            <div class="row__main">
              <div class="row__heading">
                <strong class="row__title">{{ title(encountersByRouteId.get(route.id)) }}</strong>
                <Tag
                  class="row__status"
                  :value="formatEncounterStatus(encountersByRouteId.get(route.id).status)"
                  :severity="encounterStatusSeverity(encountersByRouteId.get(route.id).status)"
                  rounded
                  :data-test="`encounter-status-${encountersByRouteId.get(route.id).id}`"
                />
              </div>
              <span class="muted row__meta">{{ route.name }}</span>
              <EncounterTimestamps
                :caught-at="encountersByRouteId.get(route.id).caughtAt"
                :updated="encountersByRouteId.get(route.id).updated"
                :status="encountersByRouteId.get(route.id).status"
              />
              <p
                v-if="notes(encountersByRouteId.get(route.id))"
                class="row__notes"
                data-test="encounter-notes"
              >
                <span class="row__notes-label">Notes</span>
                {{ notes(encountersByRouteId.get(route.id)) }}
              </p>
            </div>
          </div>
          <div class="row__actions">
            <Select
              :model-value="encountersByRouteId.get(route.id).status"
              :options="encounterStatusOptions"
              option-label="label"
              option-value="value"
              class="status-select"
              :data-test="`encounter-status-select-${encountersByRouteId.get(route.id).id}`"
              @update:model-value="emit('status', encountersByRouteId.get(route.id), $event)"
            />
            <Button
              label="Remove"
              severity="secondary"
              text
              size="small"
              :data-test="`encounter-delete-${encountersByRouteId.get(route.id).id}`"
              @click="emit('remove', encountersByRouteId.get(route.id))"
            />
          </div>
        </template>
        <template v-else>
          <div class="row__top row__top--open">
            <span class="row__placeholder" />
            <div class="row__main">
              <strong class="row__title">{{ route.name }}</strong>
              <span class="muted">{{ route.encounterType }} · open</span>
            </div>
          </div>
          <Button
            class="row__log"
            label="Log"
            size="small"
            :data-test="`location-log-${route.id}`"
            @click="emit('log', route)"
          />
        </template>
      </li>
    </ul>
  </div>
</template>

<style scoped>
.checklist__toolbar {
  display: flex;
  flex-wrap: wrap;
  gap: 0.75rem;
  margin-bottom: 0.85rem;
}

.checklist__toolbar :deep(.p-inputtext) {
  flex: 1;
  min-width: 12rem;
}

.checklist__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.55rem;
}

@media (min-width: 40rem) {
  .checklist__list {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.row {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding: 0.6rem 0.7rem;
  min-width: 0;
  transition:
    transform var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
}

.row:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.row--open {
  justify-content: space-between;
}

.row__top {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.55rem;
  align-items: start;
  min-width: 0;
}

.row__top--open {
  align-items: center;
}

.row__placeholder {
  width: 5.75rem;
  height: 5.75rem;
  border-radius: var(--radius-md);
  background: var(--color-primary-soft);
  border: 1px dashed var(--color-border-strong);
}

.row__main {
  display: flex;
  flex-direction: column;
  gap: 0.12rem;
  min-width: 0;
}

.row__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.3rem 0.45rem;
  min-width: 0;
}

.row__title {
  font-family: var(--font-display);
  font-size: 0.95rem;
  line-height: 1.2;
  color: var(--color-ink);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row__status {
  flex-shrink: 0;
}

.row__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.row__notes {
  margin: 0.15rem 0 0;
  padding: 0.3rem 0.4rem;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  border: 1px solid rgb(31 122 92 / 14%);
  color: var(--color-ink);
  font-size: 0.75rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.row__notes-label {
  display: block;
  margin-bottom: 0.08rem;
  font-weight: 700;
  font-size: 0.68rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--color-primary-strong);
}

.muted {
  color: var(--color-muted);
  font-size: 0.78rem;
}

.row__actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  margin-top: auto;
}

.row__log {
  align-self: flex-end;
}

.status-select {
  flex: 1;
  min-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  .row:hover {
    transform: none;
  }
}
</style>
