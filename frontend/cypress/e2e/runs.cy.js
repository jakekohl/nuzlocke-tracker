describe('Runs pages', () => {
  const sampleRun = {
    id: 7,
    name: 'Red Hardcore',
    gameId: 1,
    status: 1,
    startDate: 1700000000,
    endDate: null,
    notes: 'First badge done',
    rules: {
      firstEncounterOnly: true,
      permadeath: true,
      nicknameRequired: true,
      dupesClause: true,
      shinyClause: true,
      setMode: false,
      levelCap: false,
    },
  }

  beforeEach(() => {
    cy.intercept('GET', /\/api\/runs\/?(\?.*)?$/, {
      statusCode: 200,
      body: [sampleRun],
    }).as('listRuns')

    cy.intercept('GET', /\/api\/runs\/7\/?(\?.*)?$/, {
      statusCode: 200,
      body: sampleRun,
    }).as('getRun')

    cy.intercept('GET', /\/api\/runs\/rules\/?(\?.*)?$/, {
      statusCode: 200,
      body: {
        rules: [
          {
            key: 'permadeath',
            label: 'Permadeath',
            description: 'Faint = dead',
            category: 'core',
            default: true,
          },
          {
            key: 'setMode',
            label: 'Set mode',
            description: 'No free switch',
            category: 'optional',
            default: false,
          },
        ],
      },
    }).as('getRules')
  })

  it('shows a settings prompt when no access key is configured', () => {
    cy.visit('/runs')
    cy.getDataTest('runs-page').should('be.visible')
    cy.getDataTest('runs-error').should('contain.text', 'access key')
    cy.getDataTest('runs-link-settings').should('be.visible')
  })

  it('lists runs and opens run details when a key is present', () => {
    cy.visit('/settings')
    cy.setSettingsAccessKey('nuz_cypress_test_key')
    cy.validateSettingsAccessKeyStatus()

    cy.clickDataTest('nav-link-runs')
    cy.wait('@listRuns')
    cy.getDataTest('runs-list').should('contain.text', 'Red Hardcore')
    cy.clickDataTest('run-link-7')

    cy.wait('@getRun')
    cy.wait('@getRules')
    cy.getDataTest('run-detail-page').should('be.visible')
    cy.getDataTest('run-detail-name').should('have.text', 'Red Hardcore')
    cy.getDataTest('run-detail-notes').should('contain.text', 'First badge done')
    cy.getDataTest('run-detail-rules-on').should('contain.text', 'Permadeath')
  })
})
