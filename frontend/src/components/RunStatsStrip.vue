<script setup>
defineProps({
  remaining: { type: Number, required: true },
  alive: { type: Number, required: true },
  boxed: { type: Number, required: true },
  dead: { type: Number, required: true },
  missed: { type: Number, required: true },
})

const emit = defineEmits(['select'])

const items = [
  { key: 'locations', label: 'Open locations', prop: 'remaining', test: 'stat-remaining' },
  { key: 'team', label: 'Team', prop: 'alive', test: 'stat-alive' },
  { key: 'box', label: 'Box', prop: 'boxed', test: 'stat-boxed' },
  { key: 'graveyard', label: 'Graveyard', prop: 'dead', test: 'stat-dead' },
  { key: 'missed', label: 'Missed / skipped', prop: 'missed', test: 'stat-missed' },
]
</script>

<template>
  <ul class="stats" data-test="run-stats">
    <li v-for="item in items" :key="item.key">
      <button
        type="button"
        class="stats__btn"
        :data-test="item.test"
        @click="emit('select', item.key)"
      >
        <span class="stats__value">{{ $props[item.prop] }}</span>
        <span class="stats__label">{{ item.label }}</span>
      </button>
    </li>
  </ul>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 0.35rem;
  list-style: none;
  margin: 0 0 1rem;
  padding: 0.35rem;
  border: 1px solid var(--color-border);
  border-radius: var(--radius-lg);
  background: rgb(251 252 249 / 85%);
  box-shadow: var(--shadow-sm);
}

.stats__btn {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.15rem;
  width: 100%;
  padding: 0.65rem 0.7rem;
  border: none;
  border-radius: var(--radius-md);
  background: transparent;
  color: inherit;
  cursor: pointer;
  text-align: left;
  font: inherit;
  transition: background var(--motion-fast) var(--ease-out);
}

.stats__btn:hover,
.stats__btn:focus-visible {
  background: var(--color-primary-soft);
  outline: none;
}

.stats__value {
  font-family: var(--font-display);
  font-size: 1.35rem;
  font-weight: 700;
  line-height: 1.1;
  color: var(--color-ink);
}

.stats__label {
  font-size: 0.72rem;
  font-weight: 600;
  color: var(--color-muted);
  line-height: 1.2;
}

@media (max-width: 40rem) {
  .stats {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}
</style>
