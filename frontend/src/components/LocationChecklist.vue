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
import { buildChecklistRows, filterChecklistRoutes, giftsAreOptional } from '@/lib/locations'
import EncounterNotesButton from '@/components/EncounterNotesButton.vue'

const props = defineProps({
  routes: { type: Array, required: true },
  encountersByRouteId: { type: Map, required: true },
  pokemonById: { type: Map, required: true },
  rules: { type: Object, default: () => ({}) },
  saveNotes: { type: Function, required: true },
})

const emit = defineEmits(['log', 'log-shiny', 'log-helper', 'status', 'remove'])

const query = ref('')
const fillFilter = ref('all')
const showOptionalGifts = ref(false)

const giftsOptional = computed(() => giftsAreOptional(props.rules))

const visibleRoutes = computed(() =>
  filterChecklistRoutes(props.routes, {
    rules: props.rules,
    showOptionalGifts: showOptionalGifts.value,
  }),
)

const fillOptions = [
  { label: 'All', value: 'all' },
  { label: 'Open', value: 'open' },
  { label: 'Filled', value: 'filled' },
]

const displayRows = computed(() =>
  buildChecklistRows(visibleRoutes.value, props.encountersByRouteId, {
    rules: props.rules,
    query: query.value,
    fill: fillFilter.value,
    pokemonById: props.pokemonById,
  }),
)

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
      <label v-if="giftsOptional" class="checklist__optional">
        <input v-model="showOptionalGifts" type="checkbox" data-test="location-show-gifts" />
        Show gifts and statics
      </label>
    </div>

    <p v-if="!displayRows.length" class="muted" data-test="run-encounters-empty">
      No locations match this filter.
    </p>
    <ul v-else class="checklist__list" data-test="run-encounters-list">
      <li
        v-for="row in displayRows"
        :key="row.key"
        class="row surface"
        :class="{ 'row--open': row.kind === 'open' }"
        :data-test="row.kind === 'encounter' ? `encounter-row-${row.encounter.id}` : `location-row-${row.route.id}`"
      >
        <template v-if="row.kind === 'encounter'">
          <div class="row__top">
            <PokemonSprite
              :pokemon-id="row.encounter.pokemonId"
              :name="pokemonName(row.encounter.pokemonId)"
              :shiny="row.encounter.isShiny"
              size="lg"
            />
            <div class="row__main">
              <div class="row__heading">
                <strong class="row__title">{{ title(row.encounter) }}</strong>
                <Tag
                  v-if="row.encounter.isShiny"
                  class="shiny-mark"
                  value="Shiny"
                  severity="warn"
                  rounded
                  :data-test="`encounter-shiny-tag-${row.encounter.id}`"
                />
                <Tag
                  v-if="row.encounter.isHmHelper"
                  value="HM helper"
                  severity="secondary"
                  rounded
                />
                <Tag
                  class="row__status"
                  :value="formatEncounterStatus(row.encounter.status)"
                  :severity="encounterStatusSeverity(row.encounter.status)"
                  rounded
                  :data-test="`encounter-status-${row.encounter.id}`"
                />
              </div>
              <span class="muted row__meta">{{ row.route.name }}</span>
              <EncounterTimestamps
                :caught-at="row.encounter.caughtAt"
                :updated="row.encounter.updated"
                :status="row.encounter.status"
              />
            </div>
          </div>
          <div class="row__actions">
            <Select
              :model-value="row.encounter.status"
              :options="encounterStatusOptions"
              option-label="label"
              option-value="value"
              class="status-select"
              :data-test="`encounter-status-select-${row.encounter.id}`"
              @update:model-value="emit('status', row.encounter, $event)"
            />
            <EncounterNotesButton
              :notes="notes(row.encounter)"
              :save="(text) => props.saveNotes(row.encounter, text)"
            />
            <Button
              label="Remove"
              severity="secondary"
              text
              size="small"
              :data-test="`encounter-delete-${row.encounter.id}`"
              @click="emit('remove', row.encounter)"
            />
            <Button
              v-if="row.showRouteActions && rules?.shinyClause"
              class="shiny-action"
              label="Log shiny"
              severity="secondary"
              size="small"
              :data-test="`location-log-shiny-${row.route.id}`"
              @click="emit('log-shiny', row.route)"
            />
            <Button
              v-if="row.showRouteActions && rules?.hmHelper"
              label="Log helper"
              severity="secondary"
              size="small"
              :data-test="`location-log-helper-${row.route.id}`"
              @click="emit('log-helper', row.route)"
            />
          </div>
        </template>
        <template v-else>
          <div class="row__top row__top--open">
            <span class="row__placeholder" />
            <div class="row__main">
              <strong class="row__title">{{ row.route.name }}</strong>
              <span class="muted">{{ row.route.encounterType }} · open</span>
            </div>
          </div>
          <Button
            class="row__log"
            label="Log"
            size="small"
            :data-test="`location-log-${row.route.id}`"
            @click="emit('log', row.route)"
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

.checklist__optional {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  font-size: 0.85rem;
}

.checklist__list {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  grid-template-columns: 1fr;
  align-items: stretch;
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
  width: 100%;
  height: 100%;
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

.shiny-mark {
  --p-tag-warn-background: var(--color-shiny);
  --p-tag-warn-color: var(--color-shiny-ink);
  background: var(--color-shiny);
  color: var(--color-shiny-ink);
  box-shadow: inset 0 0 0 1px var(--color-shiny-strong);
}

.shiny-mark::before {
  content: '✦';
  font-size: 0.75rem;
  line-height: 1;
}

.shiny-action {
  --p-button-secondary-background: var(--color-shiny);
  --p-button-secondary-color: var(--color-shiny-ink);
  --p-button-secondary-border-color: var(--color-shiny-strong);
  --p-button-secondary-hover-background: var(--color-shiny-strong);
  --p-button-secondary-hover-color: var(--color-shiny-ink);
  --p-button-secondary-hover-border-color: var(--color-shiny-strong);
  --p-button-secondary-active-background: var(--color-shiny-strong);
  --p-button-secondary-active-color: var(--color-shiny-ink);
  --p-button-secondary-active-border-color: var(--color-shiny-strong);
  background: var(--color-shiny);
  border-color: var(--color-shiny-strong);
  color: var(--color-shiny-ink);
}

.shiny-action::before {
  content: '✦';
  font-size: 0.8rem;
  line-height: 1;
}

.row__meta {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
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
