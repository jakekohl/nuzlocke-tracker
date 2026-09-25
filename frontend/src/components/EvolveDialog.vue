<script setup>
import { computed, ref, watch } from 'vue'
import PokemonPicker from '@/components/PokemonPicker.vue'
import PokemonSprite from '@/components/PokemonSprite.vue'
import { filterEvolveOptions } from '@/lib/evolution.js'

const props = defineProps({
  visible: { type: Boolean, required: true },
  encounter: { type: Object, default: null },
  pokemonOptions: { type: Array, required: true },
  pokemonById: { type: Map, required: true },
  randomEvolutions: { type: Boolean, default: false },
  saving: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'submit'])

const dialogStyle = { width: 'min(42rem, 56vw)' }
const dialogBreakpoints = {
  '960px': 'min(36rem, 78vw)',
  '640px': '95vw',
}

const form = ref({ pokemonId: '', level: '' })

const evolveOptions = computed(() =>
  filterEvolveOptions(props.pokemonOptions, props.encounter?.pokemonId, {
    randomEvolutions: props.randomEvolutions,
  }),
)

const currentName = computed(() => {
  const id = props.encounter?.pokemonId
  if (id == null) return ''
  return props.pokemonById.get(Number(id))?.name ?? `#${id}`
})

const title = computed(() => {
  const nick = props.encounter?.nickname?.trim?.()
  if (nick) return `Evolve ${nick}`
  return currentName.value ? `Evolve ${currentName.value}` : 'Evolve'
})

watch(
  () => props.visible,
  (open) => {
    if (open) {
      form.value = { pokemonId: '', level: props.encounter?.level ?? '' }
    }
  },
)

function onSubmit() {
  emit('submit', {
    pokemonId: Number(form.value.pokemonId),
    level: form.value.level === '' || form.value.level == null ? undefined : Number(form.value.level),
  })
}
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="title"
    class="evolve-dialog"
    data-test="evolve-dialog"
    :style="dialogStyle"
    :breakpoints="dialogBreakpoints"
    @update:visible="emit('update:visible', $event)"
  >
    <div v-if="encounter" class="evolve-from">
      <PokemonSprite
        :pokemon-id="encounter.pokemonId"
        :name="currentName"
        :shiny="encounter.isShiny"
        size="lg"
      />
      <div>
        <p class="evolve-from__label">Current form</p>
        <strong>{{ currentName }}</strong>
      </div>
    </div>

    <form class="modal__form" @submit.prevent="onSubmit">
      <label class="field-label" for="evolve-pokemon">Evolves into</label>
      <PokemonPicker v-model="form.pokemonId" :options="evolveOptions" required />

      <label class="field-label" for="evolve-level">Level (optional)</label>
      <InputText
        id="evolve-level"
        v-model="form.level"
        type="number"
        class="w-full"
        data-test="evolve-level-input"
      />

      <p v-if="!evolveOptions.length" class="muted" data-test="evolve-no-options">
        No valid evolution targets for this Pokémon.
      </p>

      <div class="modal__actions">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          data-test="evolve-cancel"
          @click="emit('update:visible', false)"
        />
        <Button
          type="submit"
          label="Evolve"
          data-test="evolve-submit"
          :loading="saving"
          :disabled="!form.pokemonId || !evolveOptions.length"
        />
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
.evolve-from {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.75rem;
  padding-bottom: 0.75rem;
  border-bottom: 1px solid color-mix(in srgb, var(--p-content-border-color, #ccc) 70%, transparent);
}

.evolve-from__label {
  margin: 0;
  font-size: 0.75rem;
  opacity: 0.75;
}

.modal__form {
  display: grid;
  gap: 0.15rem;
  width: 100%;
}

.field-label {
  display: block;
  margin-top: 0.65rem;
  margin-bottom: 0.35rem;
  font-weight: 600;
  font-size: 0.8rem;
}

.w-full {
  width: 100%;
}

.muted {
  margin: 0.75rem 0 0;
  font-size: 0.85rem;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.1rem;
}
</style>
