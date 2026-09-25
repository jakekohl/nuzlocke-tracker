Cypress.Commands.add('setAccessKey', (key, encryptedKey) => {
  cy.window().then((win) => {
    win.localStorage.setItem('nuzlocke-wrap-key', key);
    win.localStorage.setItem('nuzlocke-api-key-encrypted', encryptedKey);
  });
  cy.window().then((win) => {
    expect(win.localStorage.getItem('nuzlocke-wrap-key')).to.equal(key);
    expect(win.localStorage.getItem('nuzlocke-api-key-encrypted')).to.equal(encryptedKey);
  });
});

Cypress.Commands.add('clearStoredAccessKey', () => {
  cy.window().then((win) => {
    win.localStorage.removeItem('nuzlocke-wrap-key');
    win.localStorage.removeItem('nuzlocke-api-key-encrypted');
    win.sessionStorage.removeItem('nuzlocke-wrap-key');
    win.sessionStorage.removeItem('nuzlocke-api-key-encrypted');
  });
});
