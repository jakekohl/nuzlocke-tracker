import { encounterStatuses } from '../models/Encounter.js'

const ALIVE = encounterStatuses.alive
const DEAD = encounterStatuses.dead
const BOXED = encounterStatuses.boxed
const FAILED = encounterStatuses.failed
const REVIVE_TARGETS = new Set([ALIVE, BOXED])

/**
 * Dupes clause is a warning, not a hard block.
 * Shinies skip the warning when shinyClause is enabled.
 */
export function shouldWarnDupesClause({ runRules, isShiny, pokemon, ownedFamilyIds }) {
  if (!runRules?.dupesClause) return false
  if (!pokemon?.evolutionFamilyId) return false
  if (isShiny && runRules.shinyClause) return false
  return ownedFamilyIds instanceof Set
    ? ownedFamilyIds.has(pokemon.evolutionFamilyId)
    : Boolean(ownedFamilyIds?.has?.(pokemon.evolutionFamilyId))
}

/** HM helpers and retried misses do not use up the area. */
export function encounterOccupiesRoute(encounter, rules) {
  if (!encounter) return false
  if (encounter.isHmHelper) return false
  if (rules?.missedEncounterRetry && Number(encounter.status) === FAILED) return false
  return true
}

/**
 * Decide whether first-encounter should reject this log.
 * Shiny clause and HM helpers are allowed through with warnings.
 */
export function evaluateRouteOccupancy({
  rules,
  incoming,
  othersOnRoute = [],
  otherHelperCount = 0,
  alreadyOccupies = false,
} = {}) {
  const warnings = []
  const ruleset = rules ?? {}
  const helper = Boolean(incoming?.isHmHelper) && Boolean(ruleset.hmHelper)
  if (helper && otherHelperCount >= 1) warnings.push('hmHelper')
  if (helper && Number(incoming?.status ?? ALIVE) === ALIVE) warnings.push('hmHelper')

  if (!ruleset.firstEncounterOnly) {
    return { blocked: false, warnings: unique(warnings) }
  }

  const occupants = othersOnRoute.filter((row) => encounterOccupiesRoute(row, ruleset))
  const occupies = encounterOccupiesRoute(
    {
      status: incoming?.status ?? ALIVE,
      isHmHelper: Boolean(incoming?.isHmHelper),
      isShiny: Boolean(incoming?.isShiny),
    },
    ruleset,
  )
  if (alreadyOccupies || !occupies || occupants.length === 0) {
    return { blocked: false, warnings: unique(warnings) }
  }
  if (incoming?.isShiny && ruleset.shinyClause) {
    warnings.push('shinyClause')
    return { blocked: false, warnings: unique(warnings) }
  }
  return { blocked: true, warnings: unique(warnings) }
}

export function shouldWarnSharedType({ rules, pokemon, teamTypes }) {
  if (!rules?.noSharedTypes || !pokemon?.types?.length) return false
  if (!(teamTypes instanceof Set) || teamTypes.size === 0) return false
  return pokemon.types.some((type) => teamTypes.has(type))
}

export function shouldWarnGeneration({ rules, pokemon, gameGeneration }) {
  if (!rules?.sameGenerationOnly || pokemon?.generation == null || gameGeneration == null) return false
  return Number(pokemon.generation) !== Number(gameGeneration)
}

export function collectSpeciesWarnings({
  rules,
  pokemon,
  isShiny = false,
  ownedFamilyIds,
  teamTypes,
  gameGeneration,
} = {}) {
  const warnings = []
  if (
    shouldWarnDupesClause({
      runRules: rules,
      isShiny,
      pokemon,
      ownedFamilyIds,
    })
  ) {
    warnings.push('dupesClause')
  }
  if (shouldWarnSharedType({ rules, pokemon, teamTypes })) warnings.push('noSharedTypes')
  if (shouldWarnGeneration({ rules, pokemon, gameGeneration })) warnings.push('sameGenerationOnly')
  return warnings
}

export function isReviveTransition(fromStatus, toStatus) {
  return Number(fromStatus) === DEAD && REVIVE_TARGETS.has(Number(toStatus))
}

export function collectStatusWarnings({
  rules,
  encounter,
  nextStatus,
  encounters = [],
  revivesUsed = 0,
} = {}) {
  const warnings = []
  const next = Number(nextStatus)
  if (!encounter) return warnings

  if (rules?.shinyImmuneToPermadeath && encounter.isShiny && next === DEAD) {
    warnings.push('shinyImmuneToPermadeath')
  }
  if (rules?.hmHelper && encounter.isHmHelper && next === ALIVE) {
    warnings.push('hmHelper')
  }
  if (
    rules?.blackoutIsFailure &&
    Number(encounter.status) === ALIVE &&
    next === DEAD
  ) {
    const othersAlive = encounters.some(
      (row) =>
        row.id !== encounter.id && Number(row.status) === ALIVE && !row.isHmHelper,
    )
    const boxedRemain = encounters.some(
      (row) => row.id !== encounter.id && Number(row.status) === BOXED,
    )
    if (!othersAlive && boxedRemain) warnings.push('blackoutIsFailure')
  }
  if (rules?.oneRevive && isReviveTransition(encounter.status, next) && revivesUsed >= 1) {
    warnings.push('oneRevive')
  }
  return unique(warnings)
}

export function teamTypesFromEncounters(encounters, pokemonById, { ignoreEncounterId } = {}) {
  const types = new Set()
  for (const row of encounters ?? []) {
    if (ignoreEncounterId != null && row.id === ignoreEncounterId) continue
    if (Number(row.status) !== ALIVE || row.isHmHelper) continue
    const species = pokemonById.get(Number(row.pokemonId))
    for (const type of species?.types ?? []) types.add(type)
  }
  return types
}

function unique(codes) {
  return [...new Set(codes)]
}
