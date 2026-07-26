import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildRunUpdates, toRunResponse, validateRunInput } from '../runService.js'
import { defaultRunRules } from '../runRules.js'
import { gameIds, runStatuses } from '../../models/Run.js'

describe('buildRunUpdates', () => {
  it('ignores userId so ownership cannot be reassigned via PUT', () => {
    const updates = buildRunUpdates(
      {
        name: 'Renamed',
        userId: 999,
        notes: 'hi',
      },
      1_700_000_000,
    )

    assert.equal(updates.name, 'Renamed')
    assert.equal(updates.notes, 'hi')
    assert.equal(updates.updated, 1_700_000_000)
    assert.equal('userId' in updates, false)
  })

  it('converts startDate and endDate to unix seconds', () => {
    const updates = buildRunUpdates({
      startDate: '2024-01-15T00:00:00.000Z',
      endDate: 1_700_000_000_000,
    })

    assert.equal(updates.startDate, 1_705_276_800)
    assert.equal(updates.endDate, 1_700_000_000)
  })

  it('normalizes rules onto defaults when rules are provided', () => {
    const updates = buildRunUpdates({ rules: { setMode: true } })
    assert.equal(updates.rules.setMode, true)
    assert.equal(updates.rules.permadeath, true)
    assert.equal(updates.rules.levelCap, false)
  })
})

describe('toRunResponse', () => {
  it('includes default rules when missing on legacy docs', () => {
    const response = toRunResponse({
      id: 1,
      name: 'Legacy',
      startDate: 1,
      status: 0,
      userId: 1,
      gameId: gameIds.red,
      created: 1,
      updated: 1,
    })
    assert.deepEqual(response.rules, defaultRunRules())
  })
})

describe('validateRunInput', () => {
  const validCreate = {
    name: 'Kanto run',
    startDate: '2024-01-15T00:00:00.000Z',
    gameId: gameIds.firered,
    userId: 1,
  }

  it('accepts a valid create payload', () => {
    assert.doesNotThrow(() => validateRunInput(validCreate))
  })

  it('rejects missing name on create', () => {
    assert.throws(
      () => validateRunInput({ ...validCreate, name: '  ' }),
      (error) => error.statusCode === 400 && /name/i.test(error.message),
    )
  })

  it('rejects invalid gameId', () => {
    assert.throws(
      () => validateRunInput({ ...validCreate, gameId: 9999 }),
      (error) => error.statusCode === 400 && /gameId/i.test(error.message),
    )
  })

  it('rejects invalid status on partial update', () => {
    assert.throws(
      () => validateRunInput({ status: 99 }, { partial: true }),
      (error) => error.statusCode === 400 && /status/i.test(error.message),
    )
  })

  it('rejects invalid startDate', () => {
    assert.throws(
      () => validateRunInput({ ...validCreate, startDate: 'not-a-date' }),
      (error) => error.statusCode === 400 && /startDate/i.test(error.message),
    )
  })

  it('allows valid status on partial update', () => {
    assert.doesNotThrow(() =>
      validateRunInput({ status: runStatuses.active }, { partial: true }),
    )
  })

  it('rejects unknown rule keys', () => {
    assert.throws(
      () => validateRunInput({ rules: { notARule: true } }, { partial: true }),
      (error) => error.statusCode === 400 && /unknown rule/i.test(error.message),
    )
  })
})
