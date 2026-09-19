<script setup>
import { computed } from 'vue'
import PokemonSprite from '@/components/PokemonSprite.vue'
import {
  encounterStatuses,
  encounterStatusOptions,
  formatEncounterStatus,
} from '@/constants/encounterStatuses'
import { encounterStatusSeverity } from '@/lib/statusUi'

const props = defineProps({
  encounters: { type: Array, required: true },
  pokemonById: { type: Map, required: true },
  routeById: { type: Map, required: true },
  statusFilter: { type: Number, required: true },
})

const emit = defineEmits(['status', 'remove'])

const rows = computed(() =>
  props.encounters.filter((encounter) => Number(encounter.status) === props.statusFilter),
)

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
      <PokemonSprite
        :pokemon-id="encounter.pokemonId"
        :name="pokemonName(encounter.pokemonId)"
        :shiny="encounter.isShiny"
        size="lg"
      />
      <div class="card__body">
        <strong class="card__title">{{ title(encounter) }}</strong>
        <span class="muted">
          {{ pokemonName(encounter.pokemonId) }}
          · {{ routeName(encounter.routeId) }}
        </span>
        <Tag
          class="card__status"
          :value="formatEncounterStatus(encounter.status)"
          :severity="encounterStatusSeverity(encounter.status)"
          rounded
          :data-test="`encounter-status-${encounter.id}`"
        />
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
          label="Remove"
          severity="secondary"
          text
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
  gap: 0.75rem;
}

.empty {
  margin: 0;
  padding: 1rem 0;
}

.card {
  display: grid;
  grid-template-columns: auto 1fr auto;
  gap: 0.85rem;
  align-items: center;
  padding: 0.9rem 1rem;
  transition:
    transform var(--motion-fast) var(--ease-out),
    box-shadow var(--motion-fast) var(--ease-out);
}

.card:hover {
  transform: translateY(-1px);
  box-shadow: var(--shadow-md);
}

.card__body {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  min-width: 0;
}

.card__title {
  font-family: var(--font-display);
  font-size: 1.05rem;
  color: var(--color-ink);
}

.card__status {
  align-self: flex-start;
  margin-top: 0.15rem;
}

.muted {
  color: var(--color-muted);
  font-size: 0.85rem;
}

.card__actions {
  display: flex;
  gap: 0.35rem;
  align-items: center;
}

.status-select {
  min-width: 9rem;
}

@media (max-width: 40rem) {
  .card {
    grid-template-columns: auto 1fr;
  }

  .card__actions {
    grid-column: 1 / -1;
    justify-content: flex-end;
  }
}

@media (prefers-reduced-motion: reduce) {
  .card:hover {
    transform: none;
  }
}
</style>
