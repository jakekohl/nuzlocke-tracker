<script setup></script>

<template>
  <div class="app">
    <nav class="app-nav" data-test="app-nav" aria-label="Main">
      <RouterLink to="/" data-test="nav-link-home">Home</RouterLink>
      <RouterLink to="/runs" data-test="nav-link-runs">Runs</RouterLink>
      <RouterLink to="/settings" data-test="nav-link-settings">Settings</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  margin: 0;
}

.app {
  min-height: 100dvh;
  padding-bottom: env(safe-area-inset-bottom, 0);
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem 0.5rem;
  position: sticky;
  top: 0;
  z-index: 10;
  padding: max(0.5rem, env(safe-area-inset-top, 0)) max(1rem, env(safe-area-inset-right, 0)) 0.5rem
    max(1rem, env(safe-area-inset-left, 0));
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.app-nav a {
  display: inline-flex;
  align-items: center;
  min-height: 2.75rem;
  padding: 0.5rem 0.75rem;
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
  border-radius: 0.375rem;
}

.app-nav a:hover,
.app-nav a:focus-visible {
  background: #f0f7ff;
  outline: none;
}

.app-nav a.router-link-active {
  text-decoration: underline;
  text-underline-offset: 0.2em;
}
</style>
