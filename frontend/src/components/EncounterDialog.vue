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
    @update:visible="emit('update:visible', $event)"
  >
    <form class="modal__form" @submit.prevent="emit('submit')">
      <label class="field" for="enc-status">Outcome</label>
      <Select
        :model-value="form.status"
        input-id="enc-status"
        :options="logOutcomeOptions"
        option-label="label"
        option-value="value"
        class="field__input"
        data-test="encounter-outcome-select"
        @update:model-value="form.status = $event"
      />

      <label class="field" for="enc-pokemon">Pokémon</label>
      <PokemonPicker
        v-model="form.pokemonId"
        :options="pokemonOptions"
        :required="speciesRequired"
      />

      <label class="field" for="enc-nickname">Nickname</label>
      <input
        id="enc-nickname"
        v-model="form.nickname"
        type="text"
        class="field__input"
        data-test="encounter-nickname-input"
        :required="nicknameRequired && speciesRequired"
      />

      <label class="field field--inline">
        <input v-model="form.isShiny" type="checkbox" data-test="encounter-shiny" />
        Shiny
      </label>

      <label class="field" for="enc-level">Level (optional)</label>
      <InputText id="enc-level" v-model="form.level" type="number" data-test="encounter-level-input" />

      <label class="field" for="enc-notes">Notes</label>
      <Textarea id="enc-notes" v-model="form.notes" rows="2" data-test="encounter-notes-input" />

      <p v-if="dupesWarning" class="dupes-warning" role="status" data-test="encounter-dupes-warning">
        Dupes clause: you already have this evolution line. You can still save if you meant to.
      </p>

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
  gap: 0.35rem;
}

.field {
  display: block;
  margin-top: 0.65rem;
  font-weight: 600;
  font-size: 0.8rem;
}

.field--inline {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-weight: 500;
}

.field__input,
.pokemon-picker {
  width: 100%;
}

.dupes-warning {
  margin: 0.75rem 0 0;
  padding: 0.65rem 0.75rem;
  border-radius: 0.4rem;
  background: #fff8e1;
  color: #f57f17;
  font-size: 0.85rem;
}

.modal__actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.5rem;
  margin-top: 1.1rem;
}
</style>
