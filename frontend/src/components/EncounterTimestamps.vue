<script setup>
import { computed } from 'vue'
import { formatUnixDateTime } from '@/lib/dates'
import { formatEncounterStatus } from '@/constants/encounterStatuses'

const props = defineProps({
  caughtAt: { type: [Number, String], default: null },
  updated: { type: [Number, String], default: null },
  status: { type: [Number, String], required: true },
})

const statusLabel = computed(() => formatEncounterStatus(props.status))
</script>

<template>
  <dl class="timestamps muted" data-test="encounter-timestamps">
    <div class="timestamps__row">
      <dt>Caught</dt>
      <dd data-test="encounter-caught-at">{{ formatUnixDateTime(caughtAt) }}</dd>
    </div>
    <div class="timestamps__row">
      <dt data-test="encounter-status-time-label">{{ statusLabel }}</dt>
      <dd data-test="encounter-updated-at">{{ formatUnixDateTime(updated) }}</dd>
    </div>
  </dl>
</template>

<style scoped>
.timestamps {
  display: grid;
  gap: 0.05rem;
  margin: 0;
  padding: 0;
  font-size: 0.72rem;
  line-height: 1.3;
}

.timestamps__row {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 0.3rem;
  align-items: baseline;
}

.timestamps dt {
  margin: 0;
  font-weight: 600;
  color: var(--color-muted);
  white-space: nowrap;
}

.timestamps dt::after {
  content: ':';
}

.timestamps dd {
  margin: 0;
  color: var(--color-muted);
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.muted {
  color: var(--color-muted);
}
</style>
