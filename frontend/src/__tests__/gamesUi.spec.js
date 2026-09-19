import { describe, it, expect } from 'vitest'
import { gamesGroupedByGeneration } from '@/lib/gamesUi'

describe('gamesGroupedByGeneration', () => {
  it('groups games in generation order', () => {
    const groups = gamesGroupedByGeneration([
      { id: 4, label: 'Gold', generation: 2 },
      { id: 1, label: 'Red', generation: 1 },
      { id: 2, label: 'Blue', generation: 1 },
    ])
    expect(groups.map((g) => g.generation)).toEqual([1, 2])
    expect(groups[0].games.map((g) => g.label)).toEqual(['Red', 'Blue'])
  })
})
