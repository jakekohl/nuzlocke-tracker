<script setup></script>

<template>
  <main class="not-found" data-test="not-found-page">
    <h1>Page not found</h1>
    <p class="lede">That route doesn’t exist. Head home to keep tracking your run.</p>
    <RouterLink to="/" class="btn btn--primary" data-test="not-found-home">Go home</RouterLink>
  </main>
</template>

<style scoped>
.not-found {
  max-width: 32rem;
  margin: 1.5rem auto 2rem;
  padding: 0 max(1rem, env(safe-area-inset-right, 0)) 0 max(1rem, env(safe-area-inset-left, 0));
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
  text-align: center;
}

.not-found h1 {
  margin: 0 0 0.75rem;
  font-size: clamp(1.5rem, 5vw, 2rem);
  color: #1a1a1a;
}

.lede {
  margin: 0 0 1.5rem;
  color: #444;
  line-height: 1.45;
  font-size: 0.95rem;
}

.btn {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 2.75rem;
  padding: 0.625rem 1.25rem;
  border: 1px solid #1976d2;
  border-radius: 0.375rem;
  background: #1976d2;
  color: #fff;
  font: inherit;
  font-weight: 500;
  text-decoration: none;
}

.btn:hover {
  background: #1565c0;
  border-color: #1565c0;
}

@media (max-width: 39.99rem) {
  .btn {
    width: 100%;
    max-width: 20rem;
  }
}
</style>
