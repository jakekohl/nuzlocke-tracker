/**
 * Filter species options for the evolve picker.
 * Vanilla: only immediate next stages. Random: any other species in the list.
 */
export function filterEvolveOptions(pokemonOptions, fromPokemonId, { randomEvolutions = false } = {}) {
  const fromId = Number(fromPokemonId)
  if (!Number.isFinite(fromId) || !Array.isArray(pokemonOptions)) return []

  if (randomEvolutions) {
    return pokemonOptions.filter((p) => Number(p.id) !== fromId)
  }

  return pokemonOptions.filter((p) => Number(p.evolvesFromId) === fromId)
}

/** True when the encounter can show an Evolve action. */
export function canShowEvolve(encounter, pokemonOptions, { randomEvolutions = false } = {}) {
  if (!encounter || encounter.pokemonId == null) return false
  return filterEvolveOptions(pokemonOptions, encounter.pokemonId, { randomEvolutions }).length > 0
}

/**
 * Build timeline forms for history UI: original catch + each evolution step.
 */
export function buildEvolutionTimeline(encounter) {
  if (!encounter || encounter.pokemonId == null) return []

  const history = Array.isArray(encounter.evolutionHistory) ? encounter.evolutionHistory : []
  if (!history.length) {
    return [
      {
        pokemonId: encounter.pokemonId,
        kind: 'caught',
        evolvedAt: encounter.caughtAt ?? null,
        level: encounter.level ?? null,
      },
    ]
  }

  const steps = [
    {
      pokemonId: history[0].fromPokemonId,
      kind: 'caught',
      evolvedAt: encounter.caughtAt ?? null,
      level: null,
    },
  ]

  for (const entry of history) {
    steps.push({
      pokemonId: entry.toPokemonId,
      kind: 'evolved',
      evolvedAt: entry.evolvedAt ?? null,
      level: entry.level ?? null,
    })
  }

  return steps
}
