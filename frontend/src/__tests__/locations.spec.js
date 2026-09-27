import { describe, it, expect } from 'vitest'
import { buildChecklistRows, filterChecklistRoutes } from '@/lib/locations'
import { encounterStatuses } from '@/constants/encounterStatuses'

const routes = [
  { id: 1, slug: 'pallet-town-starter', encounterType: 'gift', parentSlug: null },
  { id: 2, slug: 'route-1', encounterType: 'wild', parentSlug: null },
  { id: 35, slug: 'safari-zone', encounterType: 'wild', parentSlug: null },
  { id: 36, slug: 'safari-zone-center', encounterType: 'wild', parentSlug: 'safari-zone' },
  { id: 40, slug: 'power-plant-zapdos', encounterType: 'static', parentSlug: 'power-plant' },
]

describe('filterChecklistRoutes', () => {
  it('hides the safari parent when each section is its own encounter', () => {
    const visible = filterChecklistRoutes(routes, { rules: { safariZonePerSection: true, giftPokemonAreEncounters: true } })
    expect(visible.map((row) => row.id)).toEqual([1, 2, 36, 40])
  })

  it('hides safari sections when the zone is one encounter', () => {
    const visible = filterChecklistRoutes(routes, { rules: { safariZonePerSection: false, giftPokemonAreEncounters: true } })
    expect(visible.map((row) => row.id)).toEqual([1, 2, 35, 40])
  })

  it('drops gifts and statics unless they are shown as optional', () => {
    const hidden = filterChecklistRoutes(routes, {
      rules: { safariZonePerSection: true, giftPokemonAreEncounters: false },
    })
    expect(hidden.map((row) => row.id)).toEqual([2, 36])

    const shown = filterChecklistRoutes(routes, {
      rules: { safariZonePerSection: true, giftPokemonAreEncounters: false },
      showOptionalGifts: true,
    })
    expect(shown.map((row) => row.id)).toEqual([1, 2, 36, 40])
  })
})

describe('buildChecklistRows', () => {
  const checklistRoutes = [
    { id: 1, name: 'Pallet Town', encounterType: 'gift' },
    { id: 2, name: 'Route 1', encounterType: 'wild' },
  ]
  const encountersByRouteId = new Map([
    [
      1,
      [
        { id: 10, routeId: 1, nickname: 'Bulba', pokemonId: 1, status: encounterStatuses.alive, isShiny: false },
        { id: 11, routeId: 1, nickname: 'Spark', pokemonId: 4, status: encounterStatuses.alive, isShiny: true },
      ],
    ],
  ])

  it('shows the original catch and a shiny logged on the same route', () => {
    const rows = buildChecklistRows(checklistRoutes, encountersByRouteId, {
      rules: { shinyClause: true },
    })
    expect(rows.map((row) => row.key)).toEqual(['encounter-10', 'encounter-11', 'open-2'])
    expect(rows[0].showRouteActions).toBe(true)
    expect(rows[1].encounter.nickname).toBe('Spark')
  })

  it('keeps a missed area open when retry is on', () => {
    const rows = buildChecklistRows(
      checklistRoutes,
      new Map([[2, [{ id: 12, routeId: 2, status: encounterStatuses.failed }]]]),
      { rules: { missedEncounterRetry: true } },
    )
    expect(rows.map((row) => row.key)).toEqual(['open-1', 'encounter-12', 'open-2'])
  })
})
