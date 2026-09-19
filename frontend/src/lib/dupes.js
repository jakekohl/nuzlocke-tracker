import { encounterStatuses } from '@/constants/encounterStatuses'

const OWNED_STATUSES = new Set([encounterStatuses.alive, encounterStatuses.boxed])

export function shouldWarnDupes({ rules, isShiny, pokemon, encounters, pokemonById, ignoreEncounterId }) {
  if (!rules?.dupesClause || !pokemon) return false
  if (isShiny && rules.shinyClause) return false
  const familyId = pokemon.evolutionFamilyId
  if (familyId == null) return false

  return encounters.some((encounter) => {
    if (ignoreEncounterId != null && encounter.id === ignoreEncounterId) return false
    if (!OWNED_STATUSES.has(Number(encounter.status))) return false
    const other = pokemonById?.get(Number(encounter.pokemonId))
    return Boolean(other && other.evolutionFamilyId === familyId)
  })
}
