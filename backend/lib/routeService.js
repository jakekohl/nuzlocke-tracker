import Route from '../models/Route.js'

export function toRouteResponse(doc) {
  if (!doc) return null
  return {
    id: doc.id,
    slug: doc.slug,
    name: doc.name,
    region: doc.region,
    gameIds: doc.gameIds,
    sortOrder: doc.sortOrder,
    encounterType: doc.encounterType,
    parentSlug: doc.parentSlug ?? null,
    notes: doc.notes ?? '',
  }
}

export async function listRoutes({ gameId, region, encounterType } = {}) {
  const query = {}
  if (gameId != null && gameId !== '') {
    query.gameIds = Number(gameId)
  }
  if (region) {
    query.region = String(region).toLowerCase()
  }
  if (encounterType) {
    query.encounterType = String(encounterType).toLowerCase()
  }
  const rows = await Route.find(query).sort({ sortOrder: 1, id: 1 }).lean()
  return rows.map(toRouteResponse)
}

export async function getRouteById(id) {
  const route = await Route.findOne({ id: Number(id) }).lean()
  return toRouteResponse(route)
}
