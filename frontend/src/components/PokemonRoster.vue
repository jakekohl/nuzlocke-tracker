<script setup>
import { computed } from 'vue'
import PokemonSprite from '@/components/PokemonSprite.vue'
import EncounterTimestamps from '@/components/EncounterTimestamps.vue'
import {
  encounterStatuses,
  encounterStatusOptions,
  formatEncounterStatus,
} from '@/constants/encounterStatuses'
import { encounterStatusSeverity } from '@/lib/statusUi'
import { canShowEvolve } from '@/lib/evolution.js'

const props = defineProps({
  encounters: { type: Array, required: true },
  pokemonById: { type: Map, required: true },
  pokemonOptions: { type: Array, default: () => [] },
  routeById: { type: Map, required: true },
  statusFilter: { type: Number, required: true },
  randomEvolutions: { type: Boolean, default: false },
})

const emit = defineEmits(['status', 'remove', 'evolve', 'history'])

const rows = computed(() =>
  props.encounters.filter((encounter) => Number(encounter.status) === props.statusFilter),
)

const evolvableStatuses = new Set([encounterStatuses.alive, encounterStatuses.boxed])

function pokemonName(id) {
  return props.pokemonById.get(Number(id))?.name ?? (id != null ? `#${id}` : '')
}

function routeName(id) {
  return props.routeById.get(Number(id))?.name ?? `Route ${id}`
}

function title(encounter) {
  if (
    encounter.status === encounterStatuses.failed ||
    encounter.status === encounterStatuses.skipped
  ) {
    return formatEncounterStatus(encounter.status)
  }
  return encounter.nickname || pokemonName(encounter.pokemonId)
}

function notes(encounter) {
  const text = encounter.notes?.trim?.() ?? ''
  return text || ''
}

function showEvolve(encounter) {
  if (!evolvableStatuses.has(Number(encounter.status))) return false
  return canShowEvolve(encounter, props.pokemonOptions, {
    randomEvolutions: props.randomEvolutions,
  })
}

function showHistory(encounter) {
  return (encounter.evolutionHistory?.length ?? 0) > 0
}
</script>

<template>
  <p v-if="!rows.length" class="muted empty" data-test="roster-empty">Nothing here yet.</p>
  <ul v-else class="roster" data-test="roster-list">
    <li
      v-for="encounter in rows"
      :key="encounter.id"
      class="card surface"
      :data-test="`encounter-row-${encounter.id}`"
    >
      <div class="card__top">
        <PokemonSprite
          :pokemon-id="encounter.pokemonId"
          :name="pokemonName(encounter.pokemonId)"
          :shiny="encounter.isShiny"
          size="lg"
        />
        <div class="card__body">
          <div class="card__heading">
            <strong class="card__title">{{ title(encounter) }}</strong>
            <Tag
              class="card__status"
              :value="formatEncounterStatus(encounter.status)"
              :severity="encounterStatusSeverity(encounter.status)"
              rounded
              :data-test="`encounter-status-${encounter.id}`"
            />
          </div>
          <span class="muted card__meta">
            {{ pokemonName(encounter.pokemonId) }}
            · {{ routeName(encounter.routeId) }}
          </span>
          <EncounterTimestamps
            :caught-at="encounter.caughtAt"
            :updated="encounter.updated"
            :status="encounter.status"
          />
          <p v-if="notes(encounter)" class="card__notes" data-test="encounter-notes">
            <span class="card__notes-label">Notes</span>
            {{ notes(encounter) }}
          </p>
        </div>
      </div>
      <div class="card__actions">
        <Select
          :model-value="encounter.status"
          :options="encounterStatusOptions"
          option-label="label"
          option-value="value"
          class="status-select"
          :data-test="`encounter-status-select-${encounter.id}`"
          @update:model-value="emit('status', encounter, $event)"
        />
        <Button
          v-if="showEvolve(encounter)"
          label="Evolve"
          severity="secondary"
          text
          size="small"
          :data-test="`encounter-evolve-${encounter.id}`"
          @click="emit('evolve', encounter)"
        />
        <Button
          v-if="showHistory(encounter)"
          label="History"
          severity="secondary"
          text
          size="small"
          :data-test="`encounter-history-${encounter.id}`"
          @click="emit('history', encounter)"
        />
        <Button
          label="Remove"
          severity="secondary"
          text
          size="small"
          :data-test="`encounter-delete-${encounter.id}`"
          @click="emit('remove', encounter)"
        />
      </div>
    </li>
  </ul>
</template>

<style scoped>
.roster {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  gap: 0.65rem;
}

@media (min-width: 40rem) {
  .roster {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

.empty {
  margin: 0;
  padding: 1rem 0;
}

.card {
  display: flex;
  flex-direction: column;
  gap: 0.55rem;
  padding: 0.65rem 0.75rem;
  min-width: 0;
  transition:
    transform var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
}

.card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.card__top {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.6rem;
  align-items: start;
  min-width: 0;
}

.card__body {
  display: flex;
  flex-direction: column;
  gap: 0.15rem;
  min-width: 0;
}

.card__heading {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.35rem 0.5rem;
  min-width: 0;
}

.card__title {
  font-family: var(--font-display);
  font-size: 0.98rem;
  line-height: 1.2;
  color: var(--color-ink);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card__status {
  flex-shrink: 0;
}

.card__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.card__notes {
  margin: 0.2rem 0 0;
  padding: 0.35rem 0.45rem;
  border-radius: var(--radius-sm);
  background: var(--color-primary-soft);
  border: 1px solid rgb(31 122 92 / 14%);
  color: var(--color-ink);
  font-size: 0.78rem;
  line-height: 1.35;
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card__notes-label {
  display: block;
  margin-bottom: 0.1rem;
  font-weight: 700;
  font-size: 0.7rem;
  letter-spacing: 0.02em;
  text-transform: uppercase;
  color: var(--color-primary-strong);
}

.muted {
  color: var(--color-muted);
  font-size: 0.78rem;
}

.card__actions {
  display: flex;
  gap: 0.25rem;
  align-items: center;
  margin-top: auto;
  flex-wrap: wrap;
}

.status-select {
  flex: 1;
  min-width: 0;
}

@media (prefers-reduced-motion: reduce) {
  .card:hover {
    transform: none;
  }
}
</style>
