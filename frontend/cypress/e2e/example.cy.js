describe('Home', () =>  {
  it('should load the settings page', () => {
    cy.visit('/')
    cy.getDataTest('nav-link-settings').should('be.visible')
    cy.getDataTest('nav-link-api').should('be.visible')
  })
})
