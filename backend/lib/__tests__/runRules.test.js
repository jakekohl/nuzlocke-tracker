import { describe, it } from 'node:test'
import assert from 'node:assert/strict'
import {
  defaultRunRules,
  getRulesCatalog,
  normalizeRunRules,
  RULE_KEYS,
} from '../runRules.js'

describe('defaultRunRules', () => {
  it('enables core nuzlocke rules and common clauses by default', () => {
    const rules = defaultRunRules()
    assert.equal(rules.firstEncounterOnly, true)
    assert.equal(rules.permadeath, true)
    assert.equal(rules.nicknameRequired, true)
    assert.equal(rules.dupesClause, true)
    assert.equal(rules.shinyClause, true)
    assert.equal(rules.setMode, false)
    assert.equal(rules.levelCap, false)
  })
})

describe('normalizeRunRules', () => {
  it('merges overrides onto defaults', () => {
    const rules = normalizeRunRules({ setMode: true, levelCap: true })
    assert.equal(rules.setMode, true)
    assert.equal(rules.levelCap, true)
    assert.equal(rules.permadeath, true)
  })

  it('rejects unknown keys', () => {
    assert.throws(
      () => normalizeRunRules({ wonderlocke: true }),
      (error) => error.statusCode === 400 && /unknown rule/i.test(error.message),
    )
  })

  it('rejects non-boolean values', () => {
    assert.throws(
      () => normalizeRunRules({ [RULE_KEYS.setMode]: 'yes' }),
      (error) => error.statusCode === 400 && /boolean/i.test(error.message),
    )
  })

  it('partial mode only returns provided keys', () => {
    const patch = normalizeRunRules({ setMode: true }, { partial: true })
    assert.deepEqual(patch, { setMode: true })
  })
})

describe('getRulesCatalog', () => {
  it('returns a definition for every default rule key', () => {
    const catalog = getRulesCatalog()
    const defaults = defaultRunRules()
    assert.equal(catalog.length, Object.keys(defaults).length)
    for (const rule of catalog) {
      assert.equal(typeof rule.key, 'string')
      assert.equal(typeof rule.label, 'string')
      assert.equal(typeof rule.default, 'boolean')
    }
  })
})
