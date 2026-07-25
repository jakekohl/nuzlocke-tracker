import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import { buildRunUpdates } from '../runService.js'

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
})
