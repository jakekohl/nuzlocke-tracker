export function unixNow() {
  return Math.floor(Date.now() / 1000)
}

export function toUnixTimestamp(value) {
  if (value == null) return value
  if (typeof value === 'number') {
    return value > 1e12 ? Math.floor(value / 1000) : Math.floor(value)
  }
  const ms = new Date(value).getTime()
  if (Number.isNaN(ms)) {
    throw new Error('Invalid date value')
  }
  return Math.floor(ms / 1000)
}
