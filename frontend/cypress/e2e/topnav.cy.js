describe('Top navigation', () => {
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

  beforeEach(() => {
    cy.visit('/')
  })

  for (const link of navLinks) {
    it(`should navigate to ${link.label}`, () => {
      cy.getDataTest(link.testId).should('be.visible')
      cy.clickDataTest(link.testId)
      cy.url().should('include', link.url)
    })
  }

  it('should show a footer GitHub link to the repo', () => {
    cy.getDataTest('site-footer').should('be.visible')
    cy.getDataTest('footer-github')
      .should('be.visible')
      .and('have.attr', 'href', 'https://github.com/jakekohl/nuzlocke-tracker')
      .and('have.attr', 'target', '_blank')
  })

  it('should show the brand logo in the nav', () => {
    cy.getDataTest('nav-brand').find('[data-test=brand-logo]').should('be.visible')
  })
})
