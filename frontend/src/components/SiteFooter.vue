<script setup>
import { RouterLink } from 'vue-router'
import BrandLogo from '@/components/BrandLogo.vue'

const REPO_URL = 'https://github.com/jakekohl/nuzlocke-tracker'
const year = new Date().getFullYear()
</script>

<template>
  <footer class="site-footer" data-test="site-footer">
    <div class="site-footer__inner">
      <div class="site-footer__brand">
        <div class="site-footer__brand-row">
          <BrandLogo size="md" decorative />
          <p class="site-footer__name">Nuzlocke Tracker</p>
        </div>
        <p class="site-footer__tagline muted">
          A personal tool for logging Nuzlocke playthroughs — locations, catches, and rules.
        </p>
      </div>

      <nav class="site-footer__nav" aria-label="Footer">
        <RouterLink to="/" data-test="footer-link-home">Home</RouterLink>
        <RouterLink to="/runs" data-test="footer-link-runs">Runs</RouterLink>
        <RouterLink to="/settings" data-test="footer-link-settings">Settings</RouterLink>
      </nav>

      <div class="site-footer__actions">
        <Button
          as="a"
          :href="REPO_URL"
          target="_blank"
          rel="noopener noreferrer"
          label="GitHub"
          severity="secondary"
          outlined
          data-test="footer-github"
        >
          <template #icon="{ class: iconClass }">
            <svg
              :class="[iconClass, 'github-icon']"
              viewBox="0 0 16 16"
              width="16"
              height="16"
              aria-hidden="true"
              focusable="false"
            >
              <path
                fill="currentColor"
                d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27s1.36.09 2 .27c1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8z"
              />
            </svg>
          </template>
        </Button>
      </div>

      <div class="site-footer__meta muted" data-test="footer-disclaimers">
        <p data-test="footer-copyright">© {{ year }} Nuzlocke Tracker</p>
        <p>
          Unofficial fan project. Not affiliated with, endorsed by, or associated with Nintendo,
          Game Freak, Creatures Inc., The Pokémon Company, or any of their subsidiaries or
          affiliates. Pokémon and Pokémon character names are trademarks of their respective
          owners. All rights in those materials remain with their owners.
        </p>
        <p>
          This site is provided for personal, non-commercial use as a hobby tool for tracking
          Nuzlocke playthroughs. Game names, artwork, sprites, and related materials referenced
          here are the property of their respective rights holders and are used only for
          identification and fan documentation.
        </p>
        <p>
          Provided “as is,” without warranties of any kind, express or implied, including
          merchantability, fitness for a particular purpose, and non-infringement. Use at your
          own risk. To the fullest extent permitted by law, the authors are not liable for any
          damages, data loss, account issues, or other claims arising from use of (or inability
          to use) this service.
        </p>
        <p>
          You are responsible for safeguarding your access keys and any data you store. Content
          you enter is yours; do not upload anything you do not have the right to use. By using
          this site you agree to these terms.
        </p>
      </div>
    </div>
  </footer>
</template>

<style scoped>
.site-footer {
  margin-top: auto;
  border-top: 1px solid var(--color-border);
  background: rgb(251 252 249 / 72%);
  backdrop-filter: blur(10px);
}

.site-footer__inner {
  display: grid;
  gap: var(--space-5);
  width: min(100% - 2rem, var(--page-max));
  margin-inline: auto;
  padding: var(--space-6) 0 calc(var(--space-5) + env(safe-area-inset-bottom, 0));
}

@media (min-width: 40rem) {
  .site-footer__inner {
    grid-template-columns: 1.4fr 1fr auto;
    grid-template-areas:
      'brand nav actions'
      'meta meta meta';
    align-items: start;
    column-gap: var(--space-6);
  }

  .site-footer__brand {
    grid-area: brand;
  }

  .site-footer__nav {
    grid-area: nav;
  }

  .site-footer__actions {
    grid-area: actions;
    justify-self: end;
  }

  .site-footer__meta {
    grid-area: meta;
  }
}

.site-footer__brand-row {
  display: flex;
  align-items: center;
  gap: 0.65rem;
  margin-bottom: var(--space-2);
}

.site-footer__name {
  margin: 0;
  font-family: var(--font-display);
  font-size: 1.15rem;
  font-weight: 600;
  letter-spacing: -0.02em;
  color: var(--color-ink);
}

.site-footer__tagline {
  margin: 0;
  max-width: 28rem;
  font-size: 0.95rem;
  line-height: 1.5;
}

.site-footer__nav {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.35rem;
}

.site-footer__nav a {
  color: var(--color-ink);
  text-decoration: none;
  font-weight: 600;
  font-size: 0.95rem;
  min-height: 2rem;
  display: inline-flex;
  align-items: center;
  transition: color var(--motion-fast) var(--ease-out);
}

.site-footer__nav a:hover,
.site-footer__nav a:focus-visible {
  color: var(--color-primary-strong);
  outline: none;
}

.site-footer__actions {
  display: flex;
  align-items: center;
}

.github-icon {
  display: block;
  flex-shrink: 0;
}

.site-footer__meta {
  display: grid;
  gap: 0.65rem;
  padding-top: var(--space-3);
  border-top: 1px solid var(--color-border);
  font-size: 0.8rem;
  line-height: 1.5;
  max-width: 56rem;
}

.site-footer__meta p {
  margin: 0;
}
</style>
