/**
 * Get an element using the data-test attribute
 * @param {string} selector - The data-test attribute value
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('getDataTest', (selector) => {
  return cy.get(`[data-test=${selector}]`)
})

/**
 * Scroll a data-test element into view and assert it is visible.
 * @param {string} selector - The data-test attribute value
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('ensureDataTestVisible', (selector) => {
  return cy
    .getDataTest(selector)
    .scrollIntoView({ offset: { top: -120, left: 0 } })
    .should('be.visible')
})

/**
 * Click an element using the data-test attribute
 * @param {string} selector - The data-test attribute value
 * @param {Object} options - The options for the click
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('clickDataTest', (selector, options) => {
  return cy.ensureDataTestVisible(selector).click(options)
})

/**
 * Type text into an element using the data-test attribute
 * @param {string} selector - The data-test attribute value
 * @param {string} text - The text to type
 * @param {Object} options - The options for the type
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('typeDataTest', (selector, text, options) => {
  cy.ensureDataTestVisible(selector).click()
  cy.getDataTest(selector).clear()
  cy.getDataTest(selector).type(text, options)
})

/**
 * Get an element using the aria-label attribute
 * @param {string} label - The aria-label attribute value
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('getAriaLabel', (label) => {
  return cy.get(`[aria-label="${label}"]`)
})

/**
 * Click an element using the aria-label attribute
 * @param {string} label - The aria-label attribute value
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('clickAriaLabel', (label) => {
  return cy.getAriaLabel(label).scrollIntoView().should('be.visible').click()
})
