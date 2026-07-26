import { defineConfig } from 'cypress'

export default defineConfig({
  e2e: {
    specPattern: 'cypress/e2e/**/*.{cy,spec}.{js,jsx,ts,tsx}',
    baseUrl: 'http://localhost:5173',
    // Desktop default; mobile.cy.js overrides via aspect-ratio presets
    viewportWidth: 1280,
    viewportHeight: 720,
    defaultBrowser: 'electron',
    defaultTimeout: 10000,
  },
})
