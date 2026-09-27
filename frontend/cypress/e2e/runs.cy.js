describe('Runs pages', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
    cy.stubTrackerApis()
  })

  it('shows a settings prompt when no access key is configured', () => {
    cy.visit('/runs')
    cy.getDataTest('runs-page').should('be.visible')
    cy.getDataTest('runs-error').should('contain.text', 'access key')
    cy.getDataTest('runs-link-settings').should('be.visible')
  })

  it('lists runs and opens run details when a key is present', () => {
    cy.intercept('PUT', /\/api\/runs\/5\/encounters\/1\/?$/, (req) => {
      req.reply({
        body: {
          id: 1,
          runId: 5,
          routeId: 1,
          pokemonId: 1,
          nickname: 'Bulba',
          status: 0,
          isShiny: false,
          level: 5,
          notes: req.body.notes,
          caughtAt: 1785021274,
          created: 1785021274,
          updated: 1785021300,
          inactive: null,
        },
      })
    }).as('saveEncounterNotes')

    cy.signInForTracker()
    cy.openRunDetailFromList()

    cy.getDataTest('run-detail-name').should('have.text', 'Test Run')
    cy.getDataTest('run-detail-status').should('contain.text', 'Not started')
    cy.getDataTest('run-encounters-list').should('be.visible')
    cy.getDataTest('encounter-row-1').should('contain.text', 'Bulba')
    cy.getDataTest('encounter-row-1').should('contain.text', 'Pallet Town (Starter)')
    cy.getDataTest('encounter-row-1').find('[data-test=encounter-timestamps]').should('be.visible')
    cy.getDataTest('encounter-row-1').find('[data-test=encounter-caught-at]').should('not.have.text', '—')
    cy.getDataTest('encounter-row-1').find('[data-test=encounter-updated-at]').should('not.have.text', '—')
    cy.getDataTest('encounter-row-1').find('[data-test=encounter-notes-button]').click()
    cy.getDataTest('encounter-notes').should('be.visible')
    cy.getDataTest('encounter-notes-input').invoke('val').should('contain', 'Starter pick')
    cy.getDataTest('encounter-notes-input').clear()
    cy.getDataTest('encounter-notes-input').type('Updated starter note')
    cy.getDataTest('encounter-notes-save').click()
    cy.wait('@saveEncounterNotes')
    cy.getDataTest('encounter-notes-input').invoke('val').should('eq', 'Updated starter note')
    cy.getDataTest('run-detail-name').click()
    cy.getDataTest('encounter-notes').should('not.exist')
    cy.getDataTest('encounter-status-1').should('contain.text', 'Alive')

    cy.clickDataTest('run-tab-notes')
    cy.getDataTest('run-edit-notes').should('have.value', '')

    cy.clickDataTest('run-button-edit-meta')
    cy.getDataTest('run-edit-name').should('have.value', 'Test Run')
    cy.clickDataTest('run-button-cancel-meta')
    cy.getDataTest('run-detail-name').should('have.text', 'Test Run')

    cy.clickDataTest('run-tab-rules')
    cy.getDataTest('run-rule-permadeath').should('be.checked')
    cy.getDataTest('run-rule-setMode').should('not.be.checked')
  })
})
