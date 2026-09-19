<script setup>
defineProps({
  remaining: { type: Number, required: true },
  alive: { type: Number, required: true },
  boxed: { type: Number, required: true },
  dead: { type: Number, required: true },
  missed: { type: Number, required: true },
})
</script>

<template>
  <ul class="stats" data-test="run-stats">
    <li>
      <span class="stats__value">{{ remaining }}</span>
      <span class="stats__label">Open locations</span>
    </li>
    <li>
      <span class="stats__value">{{ alive }}</span>
      <span class="stats__label">Team</span>
    </li>
    <li>
      <span class="stats__value">{{ boxed }}</span>
      <span class="stats__label">Box</span>
    </li>
    <li>
      <span class="stats__value">{{ dead }}</span>
      <span class="stats__label">Graveyard</span>
    </li>
    <li>
      <span class="stats__value">{{ missed }}</span>
      <span class="stats__label">Missed / skipped</span>
    </li>
  </ul>
</template>

<style scoped>
.stats {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(7rem, 1fr));
  gap: 0.65rem;
  list-style: none;
  margin: 0 0 1rem;
  padding: 0;
}

.stats li {
  padding: 0.75rem 0.85rem;
  border: 1px solid #e6e6e6;
  border-radius: 0.65rem;
  background: #fff;
}

.stats__value {
  display: block;
  font-size: 1.35rem;
  font-weight: 700;
}

.stats__label {
  font-size: 0.75rem;
  color: #666;
}
</style>
