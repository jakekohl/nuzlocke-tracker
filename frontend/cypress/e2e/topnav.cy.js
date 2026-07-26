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
})
