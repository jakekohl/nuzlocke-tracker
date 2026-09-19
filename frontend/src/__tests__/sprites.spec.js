import { describe, it, expect } from 'vitest'
import { spriteUrl, pokemonInitials } from '@/lib/sprites'

describe('spriteUrl', () => {
  it('builds PokeAPI sprite URLs including shiny variants', () => {
    expect(spriteUrl(1)).toBe(
      'https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png',
    )
    expect(spriteUrl(25, { shiny: true })).toContain('/shiny/25.png')
    expect(spriteUrl(null)).toBe('')
  })
})

describe('pokemonInitials', () => {
  it('uses the first letters of the name', () => {
    expect(pokemonInitials('Mr. Mime')).toBe('MM')
    expect(pokemonInitials('Pikachu')).toBe('P')
  })
})
