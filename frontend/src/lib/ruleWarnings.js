import { encounterStatuses } from '@/constants/encounterStatuses'
import { shouldWarnDupes } from '@/lib/dupes'

const ALIVE = encounterStatuses.alive
const DEAD = encounterStatuses.dead
const BOXED = encounterStatuses.boxed
const FAILED = encounterStatuses.failed
const REVIVE_TARGETS = new Set([ALIVE, BOXED])

export const RULE_WARNING_MESSAGES = {
  dupesClause: 'Dupes clause: you already have this evolution line. You can still save if you meant to.',
  shinyClause: 'Shiny clause: this area already has an encounter. The shiny will be logged alongside it.',
  noSharedTypes: 'Type clause: this species shares a type with a Pokémon on your team.',
  sameGenerationOnly: 'Same-generation rule: this species was not introduced in this game’s generation.',
  oneRevive: 'One revive: this run already used its revive. You can still save.',
  shinyImmuneToPermadeath: 'Shiny permadeath exception: this shiny is not supposed to be marked dead.',
  blackoutIsFailure:
    'Blackout rule: this is the last team member, and boxed Pokémon remain. The rules say the run is over.',
  hmHelper: 'HM helper: a helper should not battle, and only one extra helper is expected.',
}

export function formatWarningCodes(codes) {
  return (codes ?? [])
    .map((code) => RULE_WARNING_MESSAGES[code])
    .filter(Boolean)
    .join(' ')
}

export function encounterOccupiesRoute(encounter, rules) {
  if (!encounter) return false
  if (encounter.isHmHelper) return false
  return !(rules?.missedEncounterRetry && Number(encounter.status) === FAILED)
}

export function shouldWarnSharedType({ rules, pokemon, encounters, pokemonById, ignoreEncounterId }) {
  if (!rules?.noSharedTypes || !pokemon?.types?.length) return false
  return (encounters ?? []).some((row) => {
    if (ignoreEncounterId != null && row.id === ignoreEncounterId) return false
    if (Number(row.status) !== ALIVE || row.isHmHelper) return false
    const other = pokemonById?.get(Number(row.pokemonId))
    if (!other?.types?.length) return false
    return pokemon.types.some((type) => other.types.includes(type))
  })
}

export function shouldWarnGeneration({ rules, pokemon, gameGeneration }) {
  if (!rules?.sameGenerationOnly || pokemon?.generation == null || gameGeneration == null) return false
  return Number(pokemon.generation) !== Number(gameGeneration)
}

export function speciesHintTags(pokemon, { rules, encounters, pokemonById, gameGeneration }) {
  if (!pokemon || !rules) return []
  const tags = []
  if (
    shouldWarnDupes({
      rules,
      isShiny: false,
      pokemon,
      encounters,
      pokemonById,
    })
  ) {
    tags.push('Owned line')
  }
  if (shouldWarnSharedType({ rules, pokemon, encounters, pokemonById })) tags.push('Shared type')
  if (shouldWarnGeneration({ rules, pokemon, gameGeneration })) tags.push('Other gen')
  return tags
}

export function collectFormWarnings({
  rules,
  pokemon,
  isShiny = false,
  isHmHelper = false,
  status = ALIVE,
  encounters = [],
  pokemonById,
  gameGeneration,
  routeOccupied = false,
  otherHelperCount = 0,
} = {}) {
  const warnings = []
  if (isHmHelper && rules?.hmHelper) {
    if (otherHelperCount >= 1 || Number(status) === ALIVE) warnings.push('hmHelper')
  }
  if (isShiny && rules?.shinyClause && routeOccupied) warnings.push('shinyClause')

  const speciesOptional = Number(status) === FAILED || Number(status) === encounterStatuses.skipped
  if (pokemon && !speciesOptional) {
    if (
      shouldWarnDupes({
        rules,
        isShiny,
        pokemon,
        encounters,
        pokemonById,
      })
    ) {
      warnings.push('dupesClause')
    }
    if (shouldWarnSharedType({ rules, pokemon, encounters, pokemonById })) warnings.push('noSharedTypes')
    if (shouldWarnGeneration({ rules, pokemon, gameGeneration })) warnings.push('sameGenerationOnly')
  }
  return [...new Set(warnings)]
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
  if (rules?.hmHelper && encounter.isHmHelper && next === ALIVE) warnings.push('hmHelper')
  if (rules?.blackoutIsFailure && Number(encounter.status) === ALIVE && next === DEAD) {
    const othersAlive = encounters.some(
      (row) => row.id !== encounter.id && Number(row.status) === ALIVE && !row.isHmHelper,
    )
    const boxedRemain = encounters.some(
      (row) => row.id !== encounter.id && Number(row.status) === BOXED,
    )
    if (!othersAlive && boxedRemain) warnings.push('blackoutIsFailure')
  }
  if (rules?.oneRevive && isReviveTransition(encounter.status, next) && revivesUsed >= 1) {
    warnings.push('oneRevive')
  }
  return [...new Set(warnings)]
}
