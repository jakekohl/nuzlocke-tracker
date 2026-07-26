/** Mirrors backend `runStatuses` in models/Run.js */
export const runStatuses = {
  notStarted: 0,
  active: 1,
  completed: 2,
  abandoned: 3,
  paused: 4,
}

export const runStatusLabels = {
  [runStatuses.notStarted]: 'Not started',
  [runStatuses.active]: 'Active',
  [runStatuses.completed]: 'Completed',
  [runStatuses.abandoned]: 'Abandoned',
  [runStatuses.paused]: 'Paused',
}

export const runStatusOptions = Object.entries(runStatusLabels).map(([value, label]) => ({
  value: Number(value),
  label,
}))

export function formatRunStatus(status) {
  return runStatusLabels[Number(status)] ?? `Status ${status}`
}
