<script setup>
import { computed } from 'vue'
import PokemonSprite from '@/components/PokemonSprite.vue'
import { buildEvolutionTimeline } from '@/lib/evolution.js'
import { formatUnixDate } from '@/lib/dates'

const props = defineProps({
  visible: { type: Boolean, required: true },
  encounter: { type: Object, default: null },
  pokemonById: { type: Map, required: true },
})

const emit = defineEmits(['update:visible', 'undo'])

const dialogStyle = { width: 'min(36rem, 56vw)' }
const dialogBreakpoints = {
  '960px': 'min(32rem, 78vw)',
  '640px': '95vw',
}

const timeline = computed(() => buildEvolutionTimeline(props.encounter))

const title = computed(() => {
  const nick = props.encounter?.nickname?.trim?.()
  if (nick) return `${nick} — evolution history`
  const id = props.encounter?.pokemonId
  const name = id != null ? props.pokemonById.get(Number(id))?.name : null
  return name ? `${name} — evolution history` : 'Evolution history'
})

const canUndo = computed(() => (props.encounter?.evolutionHistory?.length ?? 0) > 0)

function pokemonName(id) {
  return props.pokemonById.get(Number(id))?.name ?? (id != null ? `#${id}` : '')
}

function stepLabel(step) {
  return step.kind === 'caught' ? 'Caught as' : 'Evolved into'
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    class="evo-history-dialog"
    data-test="evolution-history-dialog"
    :style="dialogStyle"
    :breakpoints="dialogBreakpoints"
    @update:visible="emit('update:visible', $event)"
  >
    <ol v-if="timeline.length" class="timeline" data-test="evolution-timeline">
      <li v-for="(step, index) in timeline" :key="`${step.pokemonId}-${index}`" class="timeline__item">
        <PokemonSprite
          :pokemon-id="step.pokemonId"
          :name="pokemonName(step.pokemonId)"
          :shiny="encounter?.isShiny"
          size="md"
        />
        <div class="timeline__body">
          <span class="timeline__kind">{{ stepLabel(step) }}</span>
          <strong class="timeline__name">{{ pokemonName(step.pokemonId) }}</strong>
          <span v-if="step.level != null" class="muted">Lv. {{ step.level }}</span>
          <span v-if="step.evolvedAt" class="muted">{{ formatUnixDate(step.evolvedAt) }}</span>
        </div>
      </li>
    </ol>
    <p v-else class="muted">No history yet.</p>

    <div class="modal__actions">
      <Button
        v-if="canUndo"
        type="button"
        label="Undo last evolution"
        severity="secondary"
        outlined
        data-test="evolve-undo"
        @click="emit('undo')"
      />
      <Button
        type="button"
        label="Close"
        data-test="evolution-history-close"
        @click="emit('update:visible', false)"
      />
    </div>
  </Dialog>
</template>

<style scoped>
.timeline {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 0.75rem;
}

.timeline__item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.timeline__body {
  display: flex;
  flex-direction: column;
  gap: 0.1rem;
  min-width: 0;
}

.timeline__kind {
  font-size: 0.75rem;
  opacity: 0.75;
}

.timeline__name {
  font-size: 0.95rem;
}

.muted {
  font-size: 0.8rem;
  opacity: 0.8;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-top: 1.1rem;
}
</style>
