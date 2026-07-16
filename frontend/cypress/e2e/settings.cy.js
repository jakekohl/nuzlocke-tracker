describe('Settings access key', () => {

  context('Setting the access key', () => {
    beforeEach(() => {
      cy.clearLocalStorage()
      cy.clearCookies()
      cy.visit('/settings')
    })
    it('should save an access key and verify it', () => {
      cy.fixture('api_auth.json').then((api_auth) => {
        cy.intercept('GET', '**/api/auth/me', api_auth).as('api_auth');
      });
      cy.setSettingsAccessKey('nuz_cypress_test_key_value');
      cy.validateSettingsAccessKeyStatus();
      cy.verifyAccessKey();
      cy.wait('@api_auth').then((interception) => {
        expect(interception.response.statusCode).to.equal(200);
        expect(interception.response.body.id).to.equal(1);
        expect(interception.response.body.name).to.equal('You');
        expect(interception.response.body.email).to.equal('you@example.com');
        expect(interception.response.body.apiKeyPrefix).to.equal('nuz_dl2s');
      });
    })
  })

  context('Managing the access key', () => {
    beforeEach(() => {
      cy.visit('/settings');
      cy.setSettingsAccessKey('nuz_cypress_test_key_value');
    })
    it('should clear the access key and show missing status', () => {
      cy.clearAccessKey();
      cy.validateSettingsAccessKeyStatusMissing();
    })
  })
})
