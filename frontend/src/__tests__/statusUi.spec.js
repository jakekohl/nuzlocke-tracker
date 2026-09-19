import { describe, it, expect } from 'vitest'
import { runStatuses } from '@/constants/runStatuses'
import { encounterStatuses } from '@/constants/encounterStatuses'
import { runStatusSeverity, encounterStatusSeverity } from '@/lib/statusUi'

describe('statusUi', () => {
  it('maps run statuses to Tag severities', () => {
    expect(runStatusSeverity(runStatuses.active)).toBe('success')
    expect(runStatusSeverity(runStatuses.abandoned)).toBe('danger')
    expect(runStatusSeverity(runStatuses.notStarted)).toBe('secondary')
  })

  it('maps encounter statuses to Tag severities', () => {
    expect(encounterStatusSeverity(encounterStatuses.alive)).toBe('success')
    expect(encounterStatusSeverity(encounterStatuses.dead)).toBe('danger')
    expect(encounterStatusSeverity(encounterStatuses.boxed)).toBe('info')
  })
})
