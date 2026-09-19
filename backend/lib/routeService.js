import { allLocations } from '../data/locations/index.js'

const routeById = new Map(allLocations.map((row) => [row.id, row]))

export function toRouteResponse(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    region: doc.region,
    gameIds: [...doc.gameIds],
    sortOrder: doc.sortOrder,
    encounterType: doc.encounterType,
    parentSlug: doc.parentSlug ?? null,
    notes: doc.notes ?? '',
  }
}

export function listRoutes({ gameId, region, encounterType } = {}) {
  let rows = allLocations
  if (gameId != null && gameId !== '') {
    const id = Number(gameId)
    rows = rows.filter((row) => row.gameIds.includes(id))
  }
  if (region) {
    const value = String(region).toLowerCase()
    rows = rows.filter((row) => row.region === value)
  }
  if (encounterType) {
    const value = String(encounterType).toLowerCase()
    rows = rows.filter((row) => row.encounterType === value)
  }
  return [...rows]
    .sort((a, b) => a.sortOrder - b.sortOrder || a.id - b.id)
    .map(toRouteResponse)
}

export function getRouteById(id) {
  return toRouteResponse(routeById.get(Number(id)) ?? null)
}
