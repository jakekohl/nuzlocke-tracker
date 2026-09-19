import { runStatuses } from '@/constants/runStatuses'
import { encounterStatuses } from '@/constants/encounterStatuses'

export function runStatusSeverity(status) {
  switch (Number(status)) {
    case runStatuses.active:
      return 'success'
    case runStatuses.completed:
      return 'info'
    case runStatuses.abandoned:
      return 'danger'
    case runStatuses.paused:
      return 'warn'
    case runStatuses.notStarted:
    default:
      return 'secondary'
  }
}

export function encounterStatusSeverity(status) {
  switch (Number(status)) {
    case encounterStatuses.alive:
      return 'success'
    case encounterStatuses.boxed:
      return 'info'
    case encounterStatuses.dead:
      return 'danger'
    case encounterStatuses.failed:
    case encounterStatuses.skipped:
      return 'warn'
    default:
      return 'secondary'
  }
}
