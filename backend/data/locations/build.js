/**
 * Compact location rows: [slug, name, sortOrder, encounterType?, parentSlug?, notes?]
 */
export function buildLocations({ idStart, region, gameIds, entries }) {
  return entries.map((entry, index) => {
    const [slug, name, sortOrder, encounterType = 'wild', parentSlug = null, notes = ''] = entry
    return {
      id: idStart + index,
      slug,
      name,
      region,
      gameIds: [...gameIds],
      sortOrder,
      encounterType,
      parentSlug,
      notes,
    }
  })
}
