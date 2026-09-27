import { encounterOccupiesRoute } from '@/lib/ruleWarnings'

function safariSectionParents(routes) {
  const parents = new Set()
  for (const route of routes) {
    if (route.parentSlug && String(route.parentSlug).includes('safari')) {
      parents.add(route.parentSlug)
    }
  }
  return parents
}

/**
 * Hide the safari parent or its sections, and optionally drop gift/static rows
 * when gifts do not count as encounters.
 */
export function filterChecklistRoutes(routes, { rules, showOptionalGifts = false } = {}) {
  const parents = safariSectionParents(routes)
  const perSection = rules?.safariZonePerSection !== false
  const giftsCount = rules?.giftPokemonAreEncounters !== false

  return routes.filter((route) => {
    const isSection = Boolean(route.parentSlug && parents.has(route.parentSlug))
    const isParent = parents.has(route.slug)
    if (perSection && isParent) return false
    if (!perSection && isSection) return false
    const optional = route.encounterType === 'gift' || route.encounterType === 'static'
    if (!giftsCount && optional && !showOptionalGifts) return false
    return true
  })
}

export function giftsAreOptional(rules) {
  return rules?.giftPokemonAreEncounters === false
}

function encountersOnRoute(encountersByRouteId, routeId) {
  const value = encountersByRouteId?.get?.(routeId)
  if (!value) return []
  return Array.isArray(value) ? value : [value]
}

function encounterMatchesQuery(encounter, query, pokemonById) {
  const pokemon = pokemonById?.get?.(Number(encounter.pokemonId))
  const haystack = [encounter.nickname, pokemon?.name, encounter.notes]
    .filter(Boolean)
    .join(' ')
    .toLowerCase()
  return haystack.includes(query)
}

/**
 * One card per catch on a route, plus an open row when nothing occupies the area.
 * Extra shinies and HM helpers stay visible beside the original encounter.
 */
export function buildChecklistRows(
  routes,
  encountersByRouteId,
  { rules, query = '', fill = 'all', pokemonById } = {},
) {
  const q = query.trim().toLowerCase()
  const rows = []

  for (const route of routes) {
    const encounters = encountersOnRoute(encountersByRouteId, route.id)
    const occupied = encounters.some((encounter) => encounterOccupiesRoute(encounter, rules))
    if (fill === 'open' && occupied) continue
    if (fill === 'filled' && !occupied) continue

    const routeMatches = !q || route.name.toLowerCase().includes(q)
    const visibleEncounters = encounters.filter(
      (encounter) => !q || routeMatches || encounterMatchesQuery(encounter, q, pokemonById),
    )
    if (q && !routeMatches && visibleEncounters.length === 0) continue

    visibleEncounters.forEach((encounter, index) => {
      rows.push({
        key: `encounter-${encounter.id}`,
        kind: 'encounter',
        route,
        encounter,
        showRouteActions: occupied && index === 0,
      })
    })

    if (!occupied) {
      rows.push({
        key: `open-${route.id}`,
        kind: 'open',
        route,
        encounter: null,
        showRouteActions: false,
      })
    }
  }

  return rows
}
