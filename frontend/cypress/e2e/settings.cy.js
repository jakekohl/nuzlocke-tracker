describe('Settings access key', () => {
  it('should load the settings page without API Explorer', () => {
    cy.visit('/')
    cy.getDataTest('nav-link-settings').should('be.visible')
    cy.get('body').should('not.contain', 'API Explorer')
    cy.getDataTest('api-key-status-missing').should('be.visible')
  })

  it('should save an access key and show configured status', () => {
    cy.visit('/')
    cy.clickDataTest('api-button-set')
    cy.getDataTest('api-key-input').type('nuz_cypress_test_key_value', { log: false })
    cy.clickDataTest('api-button-save')
    cy.getDataTest('api-key-status-ok').should('be.visible')
    cy.getDataTest('save-message').should('contain', 'saved')
  })
})
