// URL <-> filter state. Date filter is encoded by preset slug
// (`?d=tonight`) and search by raw query (`?q=…`) so links stay
// short and human-readable. Custom date ranges aren't encoded —
// they remain in-memory only.

export type DatePresetId = 'all' | 'tonight' | 'tomorrow' | 'weekend' | 'week'

export interface UrlFilters {
  preset: DatePresetId | null
  search: string
}

const ALL_PRESETS: DatePresetId[] = ['all', 'tonight', 'tomorrow', 'weekend', 'week']

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

function weekendRange() {
  const now = new Date()
  const dow = now.getDay()
  if (dow === 0)             return { start: startOfDay(now),        end: endOfDay(now) }
  if (dow === 6)             return { start: startOfDay(now),        end: endOfDay(addDays(now, 1)) }
  if (dow === 5)             return { start: startOfDay(now),        end: endOfDay(addDays(now, 2)) }
  const daysUntilSat = 6 - dow
  return { start: startOfDay(addDays(now, daysUntilSat)), end: endOfDay(addDays(now, daysUntilSat + 1)) }
}

export function presetToRange(p: DatePresetId): { start: Date | null; end: Date | null } {
  if (p === 'all')      return { start: null,              end: null }
  if (p === 'tonight')  return { start: new Date(),        end: endOfDay(new Date()) }
  if (p === 'tomorrow') { const t = addDays(new Date(), 1); return { start: startOfDay(t), end: endOfDay(t) } }
  if (p === 'weekend')  return weekendRange()
  if (p === 'week')     return { start: new Date(), end: endOfDay(addDays(new Date(), 7)) }
  return { start: null, end: null }
}

// Reverse-lookup: given a range, find the matching preset (within a
// 60-second tolerance) so the right chip lights up after navigating.
const sig = (r: { start: Date | null; end: Date | null }) =>
  `${r.start ? Math.round(r.start.getTime() / 60000) : 'n'}|${r.end ? Math.round(r.end.getTime() / 60000) : 'n'}`

export function rangeToPreset(r: { start: Date | null; end: Date | null }): DatePresetId | null {
  const target = sig(r)
  for (const id of ALL_PRESETS) {
    if (sig(presetToRange(id)) === target) return id
  }
  return null
}

export function readUrlFilters(search: string): UrlFilters {
  const params = new URLSearchParams(search)
  const d = params.get('d')
  const preset = d && (ALL_PRESETS as string[]).includes(d) ? (d as DatePresetId) : null
  return {
    preset,
    search: params.get('q') ?? '',
  }
}

export function writeUrlFilters(u: UrlFilters) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  if (u.preset && u.preset !== 'all') params.set('d', u.preset)
  else params.delete('d')
  if (u.search.trim()) params.set('q', u.search.trim())
  else params.delete('q')
  const qs = params.toString()
  const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
  window.history.replaceState({}, '', next)
}
