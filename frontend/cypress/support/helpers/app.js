Cypress.Commands.add('setAccessKey', (key, encryptedKey) => {
  cy.window().then((win) => {
    win.sessionStorage.setItem('nuzlocke-wrap-key', key);
    win.sessionStorage.setItem('nuzlocke-api-key-encrypted', encryptedKey);
  });
  cy.window().then((win) => {
    expect(win.sessionStorage.getItem('nuzlocke-wrap-key')).to.equal(key);
    expect(win.sessionStorage.getItem('nuzlocke-api-key-encrypted')).to.equal(encryptedKey);
  });
});

Cypress.Commands.add('clearAccessKey', () => {
  cy.window().then((win) => {
    win.sessionStorage.removeItem('nuzlocke-wrap-key');
    win.sessionStorage.removeItem('nuzlocke-api-key-encrypted');
  });
});