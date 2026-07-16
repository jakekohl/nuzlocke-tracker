/**
 * Set the settings access key
 * @param {string} key - The access key to set
 * @param {Object} options - The options for the command
 * @returns {Cypress.Chainable} - The command
 */
Cypress.Commands.add('setSettingsAccessKey', (key) => {
  cy.clickDataTest('api-button-set');
  cy.typeDataTest('api-key-input', key);
  cy.clickDataTest('api-button-save');
})

Cypress.Commands.add('validateSettingsAccessKeyStatus', () => {
  cy.getDataTest('api-key-status').should('contain', 'Access key is configured');
})

Cypress.Commands.add('clearAccessKey', () => {
  cy.clickDataTest('api-button-clear');
})

Cypress.Commands.add('verifyAccessKey', () => {
  cy.clickDataTest('api-button-verify');
})

Cypress.Commands.add('validateSettingsAccessKeyStatusMissing', () => {
  cy.getDataTest('api-key-status').should('contain', 'unauthorized');
  cy.getDataTest('api-button-verify').should('be.disabled');
})