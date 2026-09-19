<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="not-found page page--narrow" data-test="not-found-page">
    <div class="empty-panel">
      <h1>Page not found</h1>
      <p class="lede">That route doesn’t exist. Head home to keep tracking your run.</p>
      <RouterLink v-slot="{ navigate }" to="/" custom>
        <Button label="Go home" data-test="not-found-home" @click="navigate" />
      </RouterLink>
    </div>
  </main>
</template>

<style scoped>
.not-found {
  padding-top: clamp(2rem, 6vw, 4rem);
}

.not-found .empty-panel {
  justify-items: center;
  text-align: center;
}

.not-found h1 {
  margin: 0;
  font-size: clamp(1.75rem, 5vw, 2.25rem);
}

.lede {
  margin: 0;
  color: var(--color-muted);
  line-height: 1.5;
  font-size: 1rem;
  max-width: 28rem;
}
</style>
