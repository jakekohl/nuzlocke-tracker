describe('Runs pages', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()

    cy.intercept('GET', /\/api\/runs\/?(\?.*)?$/, {
      fixture: 'api/runs/ok_list.json',
    }).as('listRuns')

    cy.intercept('GET', /\/api\/runs\/rules\/?(\?.*)?$/, {
      fixture: 'api/rules/ok.json',
    }).as('getRules')

    cy.intercept('GET', /\/api\/runs\/5\/encounters\/?(\?.*)?$/, {
      fixture: 'api/encounters/ok_g1.json',
    }).as('listEncounters')

    cy.intercept('GET', /\/api\/runs\/5\/?(\?.*)?$/, {
      fixture: 'api/runs/ok_5.json',
    }).as('getRun')

    cy.intercept('GET', /\/api\/pokemon(\?.*)?$/, {
      fixture: 'api/pokemon/ok_g1.json',
    }).as('listPokemon')

    cy.intercept('GET', /\/api\/routes(\?.*)?$/, {
      fixture: 'api/routes/ok_g1.json',
    }).as('listRoutes')
  })

  it('shows a settings prompt when no access key is configured', () => {
    cy.visit('/runs')
    cy.getDataTest('runs-page').should('be.visible')
    cy.getDataTest('runs-error').should('contain.text', 'access key')
    cy.getDataTest('runs-link-settings').should('be.visible')
  })

  it('lists runs and opens run details when a key is present', () => {
    cy.visit('/settings')
    cy.setSettingsAccessKey('nuz_cypress_test_key')
    cy.validateSettingsAccessKeyStatus()

    cy.clickDataTest('nav-link-runs')
    cy.wait('@listRuns')
    cy.getDataTest('runs-list').should('contain.text', 'Test Run')
    cy.getDataTest('run-link-5').should('contain.text', 'Not started')
    cy.clickDataTest('run-link-5')

    cy.wait('@getRun')
    cy.wait('@getRules')
    cy.wait('@listEncounters')
    cy.wait('@listPokemon')
    cy.wait('@listRoutes')

    cy.getDataTest('run-detail-page').should('be.visible')
    cy.getDataTest('run-detail-name').should('have.text', 'Test Run')
    cy.getDataTest('run-detail-status').should('have.text', 'Not started')
    cy.getDataTest('run-edit-notes').should('have.value', '')
    cy.getDataTest('run-rule-permadeath').should('be.checked')
    cy.getDataTest('run-rule-setMode').should('not.be.checked')

    cy.getDataTest('run-encounters-list').should('be.visible')
    cy.getDataTest('encounter-row-1').should('contain.text', 'Bulba')
    cy.getDataTest('encounter-row-1').should('contain.text', 'Pallet Town (Starter)')
    cy.getDataTest('encounter-status-1').should('have.text', 'Alive')
  })
})
