<script setup>
import { computed } from 'vue'
import { RouterLink, RouterView } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'
import SiteFooter from '@/components/SiteFooter.vue'
import { useApiKeyStore } from '@/stores/apiKey'

const apiKeyStore = useApiKeyStore()

const keyConfigured = computed(() => apiKeyStore.isConfigured)
</script>

<template>
  <div class="app">
    <header class="app-shell" data-test="app-nav">
      <div class="app-shell__inner">
        <RouterLink to="/" class="app-brand" data-test="nav-brand">
          <BrandLogo size="sm" decorative />
          <span class="app-brand__text">Nuzlocke Tracker</span>
        </RouterLink>

        <nav class="app-nav" aria-label="Main">
          <RouterLink to="/" class="app-nav__link" data-test="nav-link-home">Home</RouterLink>
          <RouterLink to="/runs" class="app-nav__link" data-test="nav-link-runs">Runs</RouterLink>
          <RouterLink to="/settings" class="app-nav__link" data-test="nav-link-settings">
            Settings
          </RouterLink>
        </nav>

        <RouterLink
          to="/settings"
          class="key-chip"
          :class="keyConfigured ? 'key-chip--ok' : 'key-chip--warn'"
          data-test="nav-key-status"
        >
          <span class="key-chip__dot" aria-hidden="true" />
          {{ keyConfigured ? 'Key set' : 'Key needed' }}
        </RouterLink>
      </div>
    </header>

    <RouterView class="page-enter" />
    <SiteFooter />
  </div>
</template>

<style>
.app {
  display: flex;
  flex-direction: column;
  min-height: 100dvh;
}

.app-shell {
  position: sticky;
  top: 0;
  z-index: 20;
  border-bottom: 1px solid var(--color-border);
  background: rgb(251 252 249 / 88%);
  backdrop-filter: blur(12px);
}

.app-shell__inner {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem 1rem;
  width: min(100% - 2rem, var(--page-max));
  min-height: var(--nav-height);
  margin-inline: auto;
  padding: max(0.5rem, env(safe-area-inset-top, 0)) 0 0.5rem;
}

.app-brand {
  display: inline-flex;
  align-items: center;
  gap: 0.55rem;
  margin-right: auto;
  color: var(--color-ink);
  text-decoration: none;
  font-size: 1.2rem;
  line-height: 1.2;
  transition: color var(--motion-fast) var(--ease-out);
}

.app-brand__text {
  font-family: var(--font-display);
  font-weight: 600;
  letter-spacing: -0.02em;
}

.app-brand:hover,
.app-brand:focus-visible {
  color: var(--color-primary-strong);
  outline: none;
}

.app-nav {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.25rem;
}

.app-nav__link {
  display: inline-flex;
  align-items: center;
  min-height: 2.5rem;
  padding: 0.4rem 0.85rem;
  border-radius: var(--radius-pill);
  color: var(--color-muted);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  transition:
    background var(--motion-fast) var(--ease-out),
    color var(--motion-fast) var(--ease-out);
}

.app-nav__link:hover,
.app-nav__link:focus-visible {
  background: var(--color-primary-soft);
  color: var(--color-primary-strong);
  outline: none;
}

.app-nav__link.router-link-exact-active,
.app-nav__link.router-link-active:not([href='/']) {
  background: var(--color-ink);
  color: #fff;
}

.key-chip {
  display: inline-flex;
  align-items: center;
  gap: 0.4rem;
  min-height: 2.25rem;
  padding: 0.3rem 0.75rem;
  border-radius: var(--radius-pill);
  border: 1px solid var(--color-border);
  background: var(--color-surface-raised);
  color: var(--color-ink);
  text-decoration: none;
  font-size: 0.8rem;
  font-weight: 600;
  transition:
    border-color var(--motion-fast) var(--ease-out),
    background var(--motion-fast) var(--ease-out);
}

.key-chip__dot {
  width: 0.5rem;
  height: 0.5rem;
  border-radius: 50%;
  background: currentColor;
}

.key-chip--ok {
  color: var(--color-primary-strong);
  border-color: rgb(31 122 92 / 30%);
  background: var(--color-primary-soft);
}

.key-chip--warn {
  color: var(--color-warn);
  border-color: rgb(154 107 31 / 35%);
  background: var(--color-warn-soft);
}

@media (max-width: 36rem) {
  .app-shell__inner {
    gap: 0.35rem 0.5rem;
  }

  .app-brand {
    width: 100%;
    margin-right: 0;
  }

  .key-chip {
    margin-left: auto;
  }
}
</style>
