/** Mirrors backend encounterStatuses in models/Encounter.js */
export const encounterStatuses = {
  alive: 0,
  dead: 1,
  boxed: 2,
  failed: 3,
}

export const encounterStatusLabels = {
  [encounterStatuses.alive]: 'Alive',
  [encounterStatuses.dead]: 'Dead',
  [encounterStatuses.boxed]: 'Boxed',
  [encounterStatuses.failed]: 'Failed / missed',
}

export function formatEncounterStatus(status) {
  return encounterStatusLabels[Number(status)] ?? `Status ${status}`
}

export const encounterStatusOptions = Object.entries(encounterStatusLabels).map(
  ([value, label]) => ({ value: Number(value), label }),
)
