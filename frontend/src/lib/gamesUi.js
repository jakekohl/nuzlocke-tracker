export function gamesGroupedByGeneration(games) {
  const groups = []
  const byGen = new Map()
  for (const game of games) {
    const generation = game.generation ?? 0
    if (!byGen.has(generation)) {
      const group = { generation, label: `Generation ${generation}`, games: [] }
      byGen.set(generation, group)
      groups.push(group)
    }
    byGen.get(generation).games.push(game)
  }
  return groups.sort((a, b) => a.generation - b.generation)
}
