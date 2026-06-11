export function parseItalianNumber(value) {
  if (value === null || value === undefined || value === '') return NaN
  if (typeof value === 'number') return value

  let str = String(value).trim()

  // Remove trailing % (e.g. "45.2%")
  str = str.replace(/%$/, '').trim()

  // Detect if dots are thousands separators (Italian format):
  // "10.688", "1.234", "10.688,50" — dot followed by exactly 3 digits
  if (/\.\d{3}([,.]\d+)?$/.test(str) || /\d\.\d{3}(?!\d)/.test(str)) {
    str = str.replace(/\./g, '')
  }

  // Replace Italian decimal comma with dot
  str = str.replace(',', '.')

  return parseFloat(str)
}

export function calcPercentDelta(current, previous) {
  const curr = parseItalianNumber(current)
  const prev = parseItalianNumber(previous)

  if (isNaN(curr) || isNaN(prev)) return null

  if (prev === 0) {
    if (curr === 0) return { value: 0, formatted: '+0.0%', isPositive: true }
    return { value: 100, formatted: '+100.0%', isPositive: true }
  }

  const delta = ((curr - prev) / prev) * 100
  const isPositive = delta >= 0
  const formatted = (isPositive ? '+' : '') + delta.toFixed(1) + '%'

  return { value: delta, formatted, isPositive }
}

function timeToSeconds(value) {
  if (value === null || value === undefined || value === '') return NaN

  const str = String(value).trim()
  const parts = str.split(':')

  if (parts.length === 2) {
    // MM:SS
    const [m, s] = parts.map(Number)
    if (isNaN(m) || isNaN(s)) return NaN
    return m * 60 + s
  }

  if (parts.length === 3) {
    // HH:MM:SS
    const [h, m, s] = parts.map(Number)
    if (isNaN(h) || isNaN(m) || isNaN(s)) return NaN
    return h * 3600 + m * 60 + s
  }

  return NaN
}

function isTimeFormat(value) {
  if (value === null || value === undefined) return false
  return /^\d{1,2}:\d{2}(:\d{2})?$/.test(String(value).trim())
}

export function calculateTimeDelta(current, previous) {
  const curr = timeToSeconds(current)
  const prev = timeToSeconds(previous)

  if (isNaN(curr) || isNaN(prev)) return null

  if (prev === 0) {
    if (curr === 0) return { value: 0, formatted: '+0.0%', isPositive: true }
    return { value: 100, formatted: '+100.0%', isPositive: true }
  }

  const delta = ((curr - prev) / prev) * 100
  const isPositive = delta >= 0
  const formatted = (isPositive ? '+' : '') + delta.toFixed(1) + '%'

  return { value: delta, formatted, isPositive }
}

export function calcSmartDelta(current, previous) {
  if (isTimeFormat(current) && isTimeFormat(previous)) {
    return calculateTimeDelta(current, previous)
  }
  return calcPercentDelta(current, previous)
}
