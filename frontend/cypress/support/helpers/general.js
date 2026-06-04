/**
 * Get an element using the data-test attribute
 * @param {string} selector - The data-test attribute value
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('getDataTest', (selector) => {
  return cy.get(`[data-test=${selector}]`);
});

/**
 * Click an element using the data-test attribute
 * @param {string} selector - The data-test attribute value
 * @param {Object} options - The options for the click
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('clickDataTest', (selector, options) => {
  return cy.getDataTest(selector).click(options);
});

/**
 * Get an element using the aria-label attribute
 * @param {string} label - The aria-label attribute value
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('getAriaLabel', (label) => {
  return cy.get(`[aria-label="${label}"]`);
});

/**
 * Click an element using the aria-label attribute
 * @param {string} label - The aria-label attribute value
 * @returns {Cypress.Chainable} - The element
 */
Cypress.Commands.add('clickAriaLabel', (label) => {
  return cy.getAriaLabel(label).click();
});
