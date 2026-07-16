<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="home" data-test="home-page">
    <section class="hero">
      <p class="eyebrow">Personal playthrough tracker</p>
      <h1>Nuzlocke Tracker</h1>
      <p class="lede">
        Keep your hardcore Pokémon runs organized in one place — encounters, team members, and
        progress across every route and gym.
      </p>
      <div class="hero__actions">
        <RouterLink to="/settings" class="btn btn--primary" data-test="home-cta-settings">
          Get started
        </RouterLink>
      </div>
    </section>

    <section class="features" aria-labelledby="features-heading">
      <h2 id="features-heading">What you can track</h2>
      <ul class="feature-list">
        <li class="feature-card">
          <h3>Runs &amp; routes</h3>
          <p>Log each Nuzlocke attempt and the encounters you catch along the way.</p>
        </li>
        <li class="feature-card">
          <h3>Your team</h3>
          <p>Follow party members, deaths, and box Pokémon as your journey unfolds.</p>
        </li>
        <li class="feature-card">
          <h3>Private &amp; secure</h3>
          <p>Sign in with a personal access key stored only in this browser tab for the session.</p>
        </li>
      </ul>
    </section>
  </main>
</template>

<style scoped>
.home {
  max-width: 48rem;
  margin: 0 auto;
  padding: 2.5rem 1rem 3rem;
  font-family:
    system-ui,
    -apple-system,
    sans-serif;
}

.hero {
  margin-bottom: 3rem;
  text-align: center;
}

.eyebrow {
  margin: 0 0 0.5rem;
  font-size: 0.875rem;
  font-weight: 600;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  color: #1976d2;
}

.hero h1 {
  margin: 0 0 1rem;
  font-size: clamp(2rem, 5vw, 2.75rem);
  line-height: 1.15;
  color: #1a1a1a;
}

.lede {
  margin: 0 auto 1.5rem;
  max-width: 36rem;
  color: #444;
  line-height: 1.55;
  font-size: 1.05rem;
}

.hero__actions {
  display: flex;
  justify-content: center;
  gap: 0.75rem;
}

.btn {
  display: inline-block;
  padding: 0.625rem 1.25rem;
  border: 1px solid #ccc;
  border-radius: 0.375rem;
  background: #fff;
  color: inherit;
  cursor: pointer;
  font: inherit;
  font-weight: 500;
  text-decoration: none;
}

.btn--primary {
  border-color: #1976d2;
  background: #1976d2;
  color: #fff;
}

.btn--primary:hover {
  background: #1565c0;
  border-color: #1565c0;
}

.features h2 {
  margin: 0 0 1.25rem;
  font-size: 1.25rem;
  text-align: center;
  color: #333;
}

.feature-list {
  display: grid;
  gap: 1rem;
  margin: 0;
  padding: 0;
  list-style: none;
}

@media (min-width: 40rem) {
  .feature-list {
    grid-template-columns: repeat(3, 1fr);
  }
}

.feature-card {
  padding: 1.25rem;
  border: 1px solid #e0e0e0;
  border-radius: 0.5rem;
  background: #fafafa;
}

.feature-card h3 {
  margin: 0 0 0.5rem;
  font-size: 1rem;
  color: #1a1a1a;
}

.feature-card p {
  margin: 0;
  font-size: 0.9rem;
  line-height: 1.45;
  color: #555;
}
</style>
