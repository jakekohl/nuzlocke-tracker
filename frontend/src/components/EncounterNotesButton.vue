<script setup>
import { computed, ref, watch } from 'vue'
import Popover from 'primevue/popover'

const props = defineProps({
  notes: { type: String, default: '' },
  save: { type: Function, required: true },
})

const popover = ref(null)
const draft = ref(props.notes ?? '')
const saving = ref(false)

const unchanged = computed(() => draft.value.trim() === (props.notes ?? '').trim())

watch(
  () => props.notes,
  (value) => {
    draft.value = value ?? ''
  },
)

function toggle(event) {
  const opening = !popover.value?.visible
  if (opening) draft.value = props.notes ?? ''
  popover.value?.toggle(event)
}

async function submit() {
  if (unchanged.value || saving.value) return
  saving.value = true
  try {
    await props.save(draft.value.trim())
  } finally {
    saving.value = false
  }
}
</script>

<template>
  <Button
    type="button"
    label="Notes"
    severity="secondary"
    text
    size="small"
    data-test="encounter-notes-button"
    @click="toggle"
  />
  <Popover ref="popover">
    <form class="notes-pop" data-test="encounter-notes" @submit.prevent="submit">
      <label class="notes-pop__label">Notes</label>
      <Textarea
        v-model="draft"
        rows="4"
        auto-resize
        class="notes-pop__input"
        data-test="encounter-notes-input"
        placeholder="Add a note"
      />
      <Button
        type="submit"
        label="Save"
        size="small"
        data-test="encounter-notes-save"
        :loading="saving"
        :disabled="unchanged"
      />
    </form>
  </Popover>
</template>

<style scoped>
.notes-pop {
  display: grid;
  gap: 0.45rem;
  width: min(18rem, 70vw);
  margin: 0;
}

.notes-pop__label {
  font-size: 0.7rem;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: var(--color-primary-strong);
}

.notes-pop__input {
  width: 100%;
}
</style>
