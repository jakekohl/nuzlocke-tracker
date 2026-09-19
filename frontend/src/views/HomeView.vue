<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="home page page--narrow" data-test="home-page">
    <section class="hero">
      <h1 class="hero__brand">Nuzlocke Tracker</h1>
      <p class="lede">
        Keep your Nuzlocke runs organized — locations, catches with sprites, team, box, and the
        graveyard, for every mainline Pokémon game.
      </p>
      <div class="hero__actions">
        <RouterLink v-slot="{ navigate }" to="/runs" custom>
          <Button
            label="Open runs"
            data-test="home-cta-runs"
            @click="navigate"
          />
        </RouterLink>
        <RouterLink to="/settings" class="text-link" data-test="home-cta-settings">
          Settings
        </RouterLink>
      </div>
    </section>

    <section class="features" aria-labelledby="features-heading">
      <h2 id="features-heading">What you can track</h2>
      <ul class="feature-list">
        <li>
          <h3>Locations</h3>
          <p>Fill in a checklist of routes and areas as you play, including gifts and statics.</p>
        </li>
        <li>
          <h3>Team, box &amp; graveyard</h3>
          <p>See living Pokémon, boxed backups, and fallen teammates with sprites.</p>
        </li>
        <li>
          <h3>Rules you actually use</h3>
          <p>Standard or hardcore presets, plus clauses like dupes, shinies, and nicknames.</p>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.home {
  padding-top: clamp(2.5rem, 8vw, 5rem);
}

.hero {
  min-height: min(70dvh, 32rem);
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: flex-start;
  gap: var(--space-4);
  margin-bottom: var(--space-7);
}

.hero__brand {
  margin: 0;
  font-size: clamp(2.6rem, 8vw, 4rem);
  line-height: 1.05;
  color: var(--color-ink);
}

.lede {
  margin: 0;
  max-width: 34rem;
  color: var(--color-muted);
  line-height: 1.55;
  font-size: 1.125rem;
}

.hero__actions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.85rem 1.25rem;
}

.text-link {
  font-weight: 600;
  text-decoration: none;
  color: var(--color-primary-strong);
}

.text-link:hover,
.text-link:focus-visible {
  text-decoration: underline;
  outline: none;
}

.features h2 {
  margin: 0 0 1.25rem;
  font-size: 1.35rem;
  color: var(--color-ink);
}

.feature-list {
  display: grid;
  gap: 1.25rem;
  margin: 0;
  padding: 0;
  list-style: none;
  border-top: 1px solid var(--color-border);
}

@media (min-width: 40rem) {
  .feature-list {
    grid-template-columns: repeat(3, 1fr);
    gap: 1.5rem;
  }
}

.feature-list li {
  padding-top: 1.1rem;
  border-top: 1px solid var(--color-border);
}

@media (min-width: 40rem) {
  .feature-list li {
    border-top: none;
    padding-top: 0;
    border-left: 1px solid var(--color-border);
    padding-left: 1.25rem;
  }

  .feature-list li:first-child {
    border-left: none;
    padding-left: 0;
  }
}

.feature-list h3 {
  margin: 0 0 0.45rem;
  font-size: 1.05rem;
  color: var(--color-ink);
}

.feature-list p {
  margin: 0;
  font-size: 0.95rem;
  line-height: 1.45;
  color: var(--color-muted);
}
</style>
