import { describe, it, expect } from 'vitest'
import { formatUnixDate, formatUnixDateTime } from '../lib/dates'

describe('dates', () => {
  it('formats unix seconds as a local date', () => {
    expect(formatUnixDate(1785021274)).toMatch(/2026/)
  })

  it('formats unix seconds as a local date and time', () => {
    const text = formatUnixDateTime(1785021274)
    expect(text).toMatch(/2026/)
    expect(text).not.toBe(formatUnixDate(1785021274))
  })

  it('returns an em dash for missing values', () => {
    expect(formatUnixDateTime(null)).toBe('—')
    expect(formatUnixDateTime('')).toBe('—')
  })
})
