/**
 * Common mobile CSS viewports by aspect ratio (portrait).
 * Covers the ratios that dominate current phone traffic.
 */
export const mobileViewports = {
  /** ~16:9 — compact / older phones (e.g. iPhone SE) */
  'ratio-16-9': { width: 375, height: 667, label: '16:9' },
  /** ~19.5:9 — modern iPhone class (e.g. iPhone 14/15/16) */
  'ratio-19-5-9': { width: 390, height: 844, label: '19.5:9' },
  /** ~20:9 — common Android class (e.g. Galaxy / Pixel) */
  'ratio-20-9': { width: 360, height: 800, label: '20:9' },
}

/**
 * Set the viewport to a named mobile aspect-ratio preset or Cypress preset.
 * @param {keyof typeof mobileViewports | Cypress.ViewportPreset} device
 * @param {Cypress.ViewportOrientation} [orientation='portrait']
 */
Cypress.Commands.add('setMobileViewport', (device = 'ratio-19-5-9', orientation = 'portrait') => {
  const preset = mobileViewports[device]
  if (preset) {
    const landscape = orientation === 'landscape'
    cy.viewport(
      landscape ? preset.height : preset.width,
      landscape ? preset.width : preset.height,
    )
    return
  }

  cy.viewport(device, orientation)
})
