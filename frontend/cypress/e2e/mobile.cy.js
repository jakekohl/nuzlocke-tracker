import { mobileViewports } from '../support/helpers/viewport.js'

const viewports = Object.entries(mobileViewports).map(([id, preset]) => ({
  id,
  label: preset.label,
}))

const navLinks = [
  {
    label: 'Home',
    url: '/',
    testId: 'nav-link-home',
  },
  {
    label: 'Runs',
    url: '/runs',
    testId: 'nav-link-runs',
  },
  {
    label: 'Settings',
    url: '/settings',
    testId: 'nav-link-settings',
  },
]

for (const viewport of viewports) {
  describe(`Top navigation (${viewport.label})`, () => {
    beforeEach(() => {
      cy.setMobileViewport(viewport.id)
      cy.visit('/')
    })

    for (const link of navLinks) {
      it(`should navigate to ${link.label}`, () => {
        cy.getDataTest(link.testId).should('be.visible')
        cy.clickDataTest(link.testId)
        cy.url().should('include', link.url)
      })
    }
  })

  describe(`Settings access key (${viewport.label})`, () => {
    context('Setting the access key', () => {
      beforeEach(() => {
        cy.clearAllLocalStorage()
        cy.clearAllSessionStorage()
        cy.clearCookies()
        cy.setMobileViewport(viewport.id)
        cy.visit('/settings')
      })

      it('should save an access key and verify it', () => {
        cy.fixture('api_auth.json').then((api_auth) => {
          cy.intercept('GET', '**/api/auth/me', api_auth).as('api_auth')
        })
        cy.setSettingsAccessKey('nuz_cypress_test_key_value')
        cy.validateSettingsAccessKeyStatus()
        cy.verifyAccessKey()
        cy.wait('@api_auth').then((interception) => {
          expect(interception.response.statusCode).to.equal(200)
          expect(interception.response.body.id).to.equal(1)
          expect(interception.response.body.name).to.equal('You')
          expect(interception.response.body.email).to.equal('you@example.com')
          expect(interception.response.body.apiKeyPrefix).to.equal('nuz_dl2s')
        })
      })
    })

    context('Managing the access key', () => {
      beforeEach(() => {
        cy.clearAllLocalStorage()
        cy.clearAllSessionStorage()
        cy.clearCookies()
        cy.setMobileViewport(viewport.id)
        cy.visit('/settings')
        cy.setSettingsAccessKey('nuz_cypress_test_key_value')
      })

      it('should clear the access key and show missing status', () => {
        cy.clearAccessKey()
        cy.validateSettingsAccessKeyStatusMissing()
      })
    })
  })
}
