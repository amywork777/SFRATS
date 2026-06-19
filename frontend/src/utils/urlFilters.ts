// URL <-> filter state. The date filter is encoded either as a single
// day (`?day=2026-06-04`) or — for the multi-day "This weekend" shortcut —
// a preset slug (`?d=weekend`). Search is a raw query (`?q=…`). Links stay
// short and human-readable.

export type DatePresetId = 'all' | 'tonight' | 'tomorrow' | 'weekend' | 'week'

export interface UrlFilters {
  preset: DatePresetId | null
  day: string | null   // 'YYYY-MM-DD' when a single calendar day is selected
  from: string | null  // 'YYYY-MM-DD' start of a custom multi-day range
  to: string | null    // 'YYYY-MM-DD' end of a custom multi-day range
  search: string
}

const ALL_PRESETS: DatePresetId[] = ['all', 'tonight', 'tomorrow', 'weekend', 'week']

function startOfDay(d: Date) { const x = new Date(d); x.setHours(0, 0, 0, 0); return x }
function endOfDay(d: Date)   { const x = new Date(d); x.setHours(23, 59, 59, 999); return x }
function addDays(d: Date, n: number) { const x = new Date(d); x.setDate(x.getDate() + n); return x }

// ── Single calendar day <-> range ───────────────────────────────────────
function pad(n: number) { return String(n).padStart(2, '0') }

/** 'YYYY-MM-DD' (local) for a Date. */
export function dayKey(d: Date) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
}

/** Parse 'YYYY-MM-DD' into the start/end-of-day range for that local day. */
export function dayToRange(key: string): { start: Date | null; end: Date | null } {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(key)
  if (!m) return { start: null, end: null }
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
  return { start: startOfDay(d), end: endOfDay(d) }
}

/** Build a whole-day range spanning from..to (inclusive), order-normalized. */
export function rangeFromKeys(fromKey: string, toKey: string): { start: Date | null; end: Date | null } {
  const a = dayToRange(fromKey).start
  const b = dayToRange(toKey).end
  if (!a || !b) return { start: null, end: null }
  if (a <= b) return { start: a, end: b }
  // keys out of order — swap so start ≤ end
  return { start: dayToRange(toKey).start, end: dayToRange(fromKey).end }
}

/** If a range spans more than one calendar day, return its from/to keys. */
export function rangeToDays(r: { start: Date | null; end: Date | null }): { from: string; to: string } | null {
  if (!r.start || !r.end) return null
  const from = dayKey(r.start)
  const to = dayKey(r.end)
  return from === to ? null : { from, to }
}

/** If a range is exactly one calendar day's bounds, return its key, else null. */
export function rangeToDay(r: { start: Date | null; end: Date | null }): string | null {
  if (!r.start || !r.end) return null
  if (dayKey(r.start) !== dayKey(r.end)) return null
  const expected = dayToRange(dayKey(r.start))
  if (!expected.start || !expected.end) return null
  if (Math.abs(expected.start.getTime() - r.start.getTime()) > 60000) return null
  if (Math.abs(expected.end.getTime() - r.end.getTime()) > 60000) return null
  return dayKey(r.start)
}

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
  const rawDay = params.get('day')
  const day = rawDay && /^\d{4}-\d{2}-\d{2}$/.test(rawDay) ? rawDay : null
  const d = params.get('d')
  const preset = d && (ALL_PRESETS as string[]).includes(d) ? (d as DatePresetId) : null
  const rawFrom = params.get('from')
  const from = rawFrom && /^\d{4}-\d{2}-\d{2}$/.test(rawFrom) ? rawFrom : null
  const rawTo = params.get('to')
  const to = rawTo && /^\d{4}-\d{2}-\d{2}$/.test(rawTo) ? rawTo : null
  return {
    preset,
    day,
    from,
    to,
    search: params.get('q') ?? '',
  }
}

export function writeUrlFilters(u: UrlFilters) {
  if (typeof window === 'undefined') return
  const params = new URLSearchParams(window.location.search)
  // Precedence: single day > custom range > multi-day preset (weekend) > none.
  params.delete('day'); params.delete('d'); params.delete('from'); params.delete('to')
  if (u.day) params.set('day', u.day)
  else if (u.preset && u.preset !== 'all') params.set('d', u.preset)
  else if (u.from && u.to) { params.set('from', u.from); params.set('to', u.to) }
  if (u.search.trim()) params.set('q', u.search.trim())
  else params.delete('q')
  const qs = params.toString()
  const next = window.location.pathname + (qs ? `?${qs}` : '') + window.location.hash
  window.history.replaceState({}, '', next)
}
