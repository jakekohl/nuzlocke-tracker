<script setup>
import { computed } from 'vue'
import PokemonPicker from '@/components/PokemonPicker.vue'
import { encounterStatuses, logOutcomeOptions } from '@/constants/encounterStatuses'

const props = defineProps({
  visible: { type: Boolean, required: true },
  route: { type: Object, default: null },
  form: { type: Object, required: true },
  pokemonOptions: { type: Array, required: true },
  saving: { type: Boolean, default: false },
  nicknameRequired: { type: Boolean, default: false },
  dupesWarning: { type: Boolean, default: false },
})

const emit = defineEmits(['update:visible', 'submit'])

/** Desktop default; breakpoints tighten toward full-bleed on smaller screens. */
const dialogStyle = { width: 'min(42rem, 56vw)' }
const dialogBreakpoints = {
  '960px': 'min(36rem, 78vw)',
  '640px': '95vw',
}

const speciesRequired = computed(
  () =>
    props.form.status !== encounterStatuses.failed &&
    props.form.status !== encounterStatuses.skipped,
)
</script>

<template>
  <Dialog
    :visible="visible"
    modal
    :header="route ? `Log ${route.name}` : 'Log encounter'"
    class="encounter-dialog"
    data-test="encounter-dialog"
    :style="dialogStyle"
    :breakpoints="dialogBreakpoints"
    @update:visible="emit('update:visible', $event)"
  >
    <form class="modal__form" @submit.prevent="emit('submit')">
      <label class="field-label" for="enc-status">Outcome</label>
      <Select
        :model-value="form.status"
        input-id="enc-status"
        :options="logOutcomeOptions"
        option-label="label"
        option-value="value"
        class="w-full"
        data-test="encounter-outcome-select"
        @update:model-value="form.status = $event"
      />

      <label class="field-label" for="enc-pokemon">Pokémon</label>
      <PokemonPicker
        v-model="form.pokemonId"
        :options="pokemonOptions"
        :required="speciesRequired"
      />

      <label class="field-label" for="enc-nickname">Nickname</label>
      <InputText
        id="enc-nickname"
        v-model="form.nickname"
        class="w-full"
        data-test="encounter-nickname-input"
        :required="nicknameRequired && speciesRequired"
      />

      <label class="field-label field-label--inline">
        <input v-model="form.isShiny" type="checkbox" data-test="encounter-shiny" />
        Shiny
      </label>

      <label class="field-label" for="enc-level">Level (optional)</label>
      <InputText
        id="enc-level"
        v-model="form.level"
        type="number"
        class="w-full"
        data-test="encounter-level-input"
      />

      <label class="field-label" for="enc-notes">Notes</label>
      <Textarea
        id="enc-notes"
        v-model="form.notes"
        rows="3"
        class="w-full"
        data-test="encounter-notes-input"
      />

      <Message
        v-if="dupesWarning"
        severity="warn"
        :closable="false"
        class="dupes-warning"
        data-test="encounter-dupes-warning"
      >
        Dupes clause: you already have this evolution line. You can still save if you meant to.
      </Message>

      <div class="modal__actions">
        <Button
          type="button"
          label="Cancel"
          severity="secondary"
          data-test="encounter-cancel"
          @click="emit('update:visible', false)"
        />
        <Button
          type="submit"
          label="Save encounter"
          data-test="encounter-submit"
          :loading="saving"
        />
      </div>
    </form>
  </Dialog>
</template>

<style scoped>
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

.field-label--inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.w-full {
  width: 100%;
}

.dupes-warning {
  margin-top: 0.85rem;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.1rem;
}
</style>
