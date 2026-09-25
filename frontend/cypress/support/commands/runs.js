Cypress.Commands.add('stubTrackerApis', () => {
  cy.intercept('GET', 'https://raw.githubusercontent.com/PokeAPI/sprites/**', { statusCode: 204 })
  cy.intercept('GET', /\/api\/games\/?(\?.*)?$/, { fixture: 'api/games/ok.json' }).as('listGames')
  cy.intercept('GET', /\/api\/runs\/?(\?.*)?$/, { fixture: 'api/runs/ok_list.json' }).as('listRuns')
  cy.intercept('GET', /\/api\/runs\/rules\/?(\?.*)?$/, { fixture: 'api/rules/ok.json' }).as('getRules')
  cy.intercept('GET', /\/api\/runs\/5\/encounters\/?(\?.*)?$/, {
    fixture: 'api/encounters/ok_g1.json',
  }).as('listEncounters')
  cy.intercept('GET', /\/api\/runs\/5\/?(\?.*)?$/, { fixture: 'api/runs/ok_5.json' }).as('getRun')
  cy.intercept('GET', /\/api\/pokemon(\?.*)?$/, { fixture: 'api/pokemon/ok_g1.json' }).as('listPokemon')
  cy.intercept('GET', /\/api\/routes(\?.*)?$/, { fixture: 'api/routes/ok_g1.json' }).as('listRoutes')
})

Cypress.Commands.add('signInForTracker', () => {
  cy.visit('/settings')
  cy.setSettingsAccessKey('nuz_cypress_test_key')
  cy.validateSettingsAccessKeyStatus()
})

Cypress.Commands.add('openRunDetailFromList', () => {
  cy.clickDataTest('nav-link-runs')
  cy.wait('@listRuns')
  cy.clickDataTest('run-link-5')
  cy.wait('@getRun')
  cy.wait('@getRules')
  cy.wait('@listEncounters')
  cy.wait('@listRoutes')
  cy.getDataTest('run-detail-page').should('be.visible')
})

Cypress.Commands.add('primeSelectOption', (dataTest, label) => {
  cy.ensureDataTestVisible(dataTest).click()
  cy.get('.p-select-overlay').should('be.visible')
  cy.contains('.p-select-option', label).scrollIntoView().should('be.visible').click()
})

Cypress.Commands.add('openEncounterLog', (locationTestId) => {
  cy.clickDataTest(locationTestId)
  cy.wait('@listPokemon')
  cy.getDataTest('encounter-dialog').should('be.visible')
})

Cypress.Commands.add('waitForEncounterDialogClosed', () => {
  cy.get('body').find('[data-test=encounter-dialog]:visible').should('have.length', 0)
})

Cypress.Commands.add('openPartyFilter', (filterTestId) => {
  cy.clickDataTest('run-tab-party')
  cy.clickDataTest(filterTestId)
  cy.getDataTest('run-party').should('be.visible')
})
