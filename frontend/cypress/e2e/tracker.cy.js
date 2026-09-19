describe('Tracker happy paths', () => {
  beforeEach(() => {
    cy.clearAllLocalStorage()
    cy.clearAllSessionStorage()
    cy.clearCookies()
    cy.stubTrackerApis()

    cy.intercept('POST', /\/api\/runs\/?$/, { statusCode: 201, fixture: 'api/runs/ok_created.json' }).as(
      'createRun',
    )
    cy.intercept('GET', /\/api\/runs\/12\/?(\?.*)?$/, { fixture: 'api/runs/ok_created.json' }).as(
      'getCreatedRun',
    )
    cy.intercept('GET', /\/api\/runs\/12\/encounters\/?(\?.*)?$/, { body: [] }).as('listCreatedEncounters')
  })

  it('creates a run and lands on the location checklist', () => {
    cy.signInForTracker()
    cy.clickDataTest('nav-link-runs')
    cy.wait('@listRuns')
    cy.clickDataTest('runs-button-new')
    cy.getDataTest('runs-create-dialog').should('be.visible')
    cy.typeDataTest('run-name-input', 'Kanto Red Nuzlocke')
    cy.getDataTest('run-game-select').select('1')
    cy.getDataTest('run-preset-standard').check()
    cy.clickDataTest('runs-create-submit')
    cy.wait('@createRun')
    cy.getDataTest('run-detail-page').should('be.visible')
    cy.getDataTest('run-detail-name').should('contain.text', 'Kanto Red Nuzlocke')
    cy.getDataTest('run-locations').should('be.visible')
    cy.getDataTest('run-stats').should('be.visible')
  })

  it('logs a catch with a sprite, then moves it to box and graveyard', () => {
    let encounters = []

    cy.intercept('GET', /\/api\/runs\/5\/encounters\/?(\?.*)?$/, (req) => {
      req.reply({ body: encounters })
    }).as('listEncountersLive')

    cy.intercept('POST', /\/api\/runs\/5\/encounters\/?$/, (req) => {
      const created = {
        id: 21,
        runId: 5,
        routeId: req.body.routeId,
        pokemonId: req.body.pokemonId ?? 1,
        nickname: req.body.nickname ?? '',
        status: req.body.status ?? 0,
        isShiny: Boolean(req.body.isShiny),
        level: req.body.level ?? null,
        notes: req.body.notes ?? '',
        caughtAt: 1785021274,
        created: 1785021274,
        updated: 1785021274,
        inactive: null,
        warnings: [],
      }
      encounters = [...encounters, created]
      req.reply({ statusCode: 201, body: created })
    }).as('createEncounter')

    cy.intercept('PUT', /\/api\/runs\/5\/encounters\/21\/?$/, (req) => {
      encounters = encounters.map((row) =>
        row.id === 21 ? { ...row, ...req.body, updated: 1785021300 } : row,
      )
      req.reply({ body: encounters.find((row) => row.id === 21) })
    }).as('updateEncounter')

    cy.signInForTracker()
    cy.clickDataTest('nav-link-runs')
    cy.wait('@listRuns')
    cy.clickDataTest('run-link-5')
    cy.getDataTest('run-detail-page').should('be.visible')
    cy.clickDataTest('location-log-1')
    cy.getDataTest('encounter-dialog').should('be.visible')
    cy.primeSelectOption('encounter-pokemon-select', 'Bulbasaur')
    cy.typeDataTest('encounter-nickname-input', 'Bulba')
    cy.clickDataTest('encounter-submit')
    cy.wait('@createEncounter')
    cy.waitForEncounterDialogClosed()
    cy.ensureDataTestVisible('encounter-row-21').should('contain.text', 'Bulba')
    cy.getDataTest('pokemon-sprite').should('exist')

    cy.openPartyFilter('run-tab-team')
    cy.getDataTest('roster-list').should('contain.text', 'Bulba')

    cy.ensureDataTestVisible('encounter-status-select-21').click()
    cy.contains('.p-select-option', 'Boxed').scrollIntoView().should('be.visible').click()
    cy.wait('@updateEncounter')
    cy.openPartyFilter('run-tab-box')
    cy.getDataTest('roster-list').should('contain.text', 'Bulba')

    cy.ensureDataTestVisible('encounter-status-select-21').click()
    cy.contains('.p-select-option', 'Dead').scrollIntoView().should('be.visible').click()
    cy.wait('@updateEncounter')
    cy.openPartyFilter('run-tab-graveyard')
    cy.getDataTest('roster-list').should('contain.text', 'Bulba')
  })

  it('marks a location missed and saves a rule toggle', () => {
    cy.intercept('POST', /\/api\/runs\/5\/encounters\/?$/, {
      statusCode: 201,
      body: {
        id: 22,
        runId: 5,
        routeId: 2,
        pokemonId: null,
        nickname: '',
        status: 3,
        isShiny: false,
        level: null,
        notes: '',
        caughtAt: 1785021274,
        created: 1785021274,
        updated: 1785021274,
        inactive: null,
        warnings: [],
      },
    }).as('missEncounter')

    cy.intercept('PUT', /\/api\/runs\/5\/?$/, {
      body: {
        id: 5,
        name: 'Test Run',
        gameId: 1,
        status: 0,
        startDate: 1784937600,
        notes: '',
        rules: { permadeath: true, setMode: true, firstEncounterOnly: true, nicknameRequired: true },
      },
    }).as('saveRules')

    cy.signInForTracker()
    cy.openRunDetailFromList()
    cy.clickDataTest('location-log-2')
    cy.ensureDataTestVisible('encounter-outcome-select').click()
    cy.contains('.p-select-option', 'Missed').scrollIntoView().should('be.visible').click()
    cy.clickDataTest('encounter-submit')
    cy.wait('@missEncounter')
    cy.waitForEncounterDialogClosed()
    cy.ensureDataTestVisible('encounter-row-22').should('contain.text', 'Failed / missed')

    cy.clickDataTest('run-tab-rules')
    cy.ensureDataTestVisible('run-rule-setMode').check()
    cy.clickDataTest('run-button-save-rules')
    cy.wait('@saveRules')
  })

  it('shows a dupes warning when logging a family already on the team', () => {
    cy.signInForTracker()
    cy.openRunDetailFromList()
    cy.clickDataTest('location-log-2')
    cy.primeSelectOption('encounter-pokemon-select', 'Ivysaur')
    cy.typeDataTest('encounter-nickname-input', 'Ivy')
    cy.getDataTest('encounter-dupes-warning').should('be.visible')
  })
})
