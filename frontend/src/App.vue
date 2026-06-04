<script setup></script>

<template>
  <div class="app">
    <nav class="app-nav">
      <RouterLink to="/">Settings</RouterLink>
      <RouterLink to="/api">API Explorer</RouterLink>
    </nav>
    <RouterView />
  </div>
</template>

<style>
body {
  margin: 0;
}

.app-nav {
  display: flex;
  gap: 1rem;
  padding: 0.75rem 1rem;
  border-bottom: 1px solid #e0e0e0;
  background: #fff;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.app-nav a {
  color: #1976d2;
  text-decoration: none;
  font-weight: 500;
}

.app-nav a.router-link-active {
  text-decoration: underline;
}
</style>
