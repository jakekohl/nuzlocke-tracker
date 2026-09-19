<script setup>
import { computed, ref } from 'vue'
import PokemonSprite from '@/components/PokemonSprite.vue'
import {
  encounterStatuses,
  encounterStatusOptions,
  formatEncounterStatus,
} from '@/constants/encounterStatuses'

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
    const haystack = [route.name, encounter?.nickname, pokemon?.name].filter(Boolean).join(' ').toLowerCase()
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
        class="row"
        :data-test="encountersByRouteId.get(route.id) ? `encounter-row-${encountersByRouteId.get(route.id).id}` : `location-row-${route.id}`"
      >
        <template v-if="encountersByRouteId.get(route.id)">
          <PokemonSprite
            :pokemon-id="encountersByRouteId.get(route.id).pokemonId"
            :name="pokemonName(encountersByRouteId.get(route.id).pokemonId)"
            :shiny="encountersByRouteId.get(route.id).isShiny"
          />
          <div class="row__main">
            <strong>{{ title(encountersByRouteId.get(route.id)) }}</strong>
            <span class="muted">
              {{ route.name }}
              ·
              <span :data-test="`encounter-status-${encountersByRouteId.get(route.id).id}`">
                {{ formatEncounterStatus(encountersByRouteId.get(route.id).status) }}
              </span>
            </span>
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
              :data-test="`encounter-delete-${encountersByRouteId.get(route.id).id}`"
              @click="emit('remove', encountersByRouteId.get(route.id))"
            />
          </div>
        </template>
        <template v-else>
          <span class="row__placeholder" />
          <div class="row__main">
            <strong>{{ route.name }}</strong>
            <span class="muted">{{ route.encounterType }} · open</span>
          </div>
          <Button
            label="Log"
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
  gap: 0.55rem;
}

.row {
  display: grid;
  grid-template-columns: 3.5rem 1fr auto;
  gap: 0.75rem;
  align-items: center;
  padding: 0.7rem 0.85rem;
  border: 1px solid #e6e6e6;
  border-radius: 0.65rem;
  background: #fff;
}

.row__placeholder {
  width: 3.5rem;
  height: 3.5rem;
  border-radius: 0.5rem;
  background: #f3f3f3;
}

.row__main {
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.muted {
  color: #666;
  font-size: 0.85rem;
}

.row__actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.status-select {
  min-width: 9rem;
}
</style>
