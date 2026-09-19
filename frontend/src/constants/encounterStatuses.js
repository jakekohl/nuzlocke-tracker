/** Mirrors backend encounterStatuses in models/Encounter.js */
export const encounterStatuses = {
  alive: 0,
  dead: 1,
  boxed: 2,
  failed: 3,
  skipped: 4,
}

export const encounterStatusLabels = {
  [encounterStatuses.alive]: 'Alive',
  [encounterStatuses.dead]: 'Dead',
  [encounterStatuses.boxed]: 'Boxed',
  [encounterStatuses.failed]: 'Failed / missed',
  [encounterStatuses.skipped]: 'Skipped',
}

export function formatEncounterStatus(status) {
  return encounterStatusLabels[Number(status)] ?? `Status ${status}`
}

export const encounterStatusOptions = Object.entries(encounterStatusLabels).map(
  ([value, label]) => ({ value: Number(value), label }),
)

export const logOutcomeOptions = [
  { value: encounterStatuses.alive, label: 'Caught' },
  { value: encounterStatuses.failed, label: 'Missed' },
  { value: encounterStatuses.skipped, label: 'Skipped' },
]
