import legacyRules from './legacyRecurrences.json'
import type { DbItem } from '../types/supabase'

export interface Recurrence {
  freq: 'daily' | 'weekly' | 'monthly'
  /** ISO weekdays: Monday=1, Sunday=7, always America/Los_Angeles. */
  byday?: number[]
  time: string
  ordinal?: number
}

const pt = new Intl.DateTimeFormat('en-CA', {
  timeZone: 'America/Los_Angeles', year: 'numeric', month: '2-digit', day: '2-digit',
  hour: '2-digit', minute: '2-digit', second: '2-digit', hourCycle: 'h23',
})
function parts(d: Date) {
  return Object.fromEntries(pt.formatToParts(d).map(p => [p.type, p.value]))
}
function wallTime(y: number, m: number, d: number, h: number, min: number): Date | null {
  const target = Date.UTC(y, m - 1, d, h, min)
  let result = target
  for (let i = 0; i < 4; i++) {
    const p = parts(new Date(result))
    const delta = target - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute, +p.second)
    if (!delta) return new Date(result)
    result += delta
  }
  // Nonexistent spring-forward local times do not create an occurrence.
  return null
}

/** Find the next start, preserving PT wall-clock time across DST. */
export function nextOccurrence(item: DbItem, now = new Date()): Date | null {
  const r = item.recurrence
  if (!r || !['daily', 'weekly', 'monthly'].includes(r.freq) || !/^([01]\d|2[0-3]):[0-5]\d$/.test(r.time)) return null
  if (r.freq !== 'daily' && (!r.byday?.length || r.byday.some(d => !Number.isInteger(d) || d < 1 || d > 7))) return null
  if (r.freq === 'monthly' && (!Number.isInteger(r.ordinal) || r.ordinal! < 1 || r.ordinal! > 5)) return null
  const seed = Date.parse(item.available_from)
  const cutoff = item.available_until ? Date.parse(item.available_until) : Infinity
  if (!Number.isFinite(seed) || Number.isNaN(cutoff)) return null
  const lower = Math.max(now.getTime(), seed)
  if (lower > cutoff) return null
  const p = parts(new Date(lower))
  const [h, min] = r.time.split(':').map(Number)
  for (let i = 0; i < 370; i++) {
    const day = new Date(Date.UTC(+p.year, +p.month - 1, +p.day + i, 12))
    if (r.freq !== 'daily' && !r.byday!.includes(day.getUTCDay() || 7)) continue
    if (r.freq === 'monthly' && Math.ceil(day.getUTCDate() / 7) !== r.ordinal) continue
    const candidate = wallTime(day.getUTCFullYear(), day.getUTCMonth() + 1, day.getUTCDate(), h, min)
    if (candidate && candidate.getTime() >= lower && candidate.getTime() <= cutoff) return candidate
  }
  return null
}

/** A series cutoff is not the end time of its next individual occurrence. */
export function projectOccurrence(item: DbItem, now = new Date()): DbItem | null {
  const legacy = (legacyRules as Record<string, { title: string; seed: string; recurrence: Recurrence }>)[item.id]
  const series = !item.recurrence && item.posted_by === 'birby' && legacy?.title === item.title
    ? { ...item, recurrence: legacy.recurrence, available_from: legacy.seed } : item
  if (!series.recurrence) return item
  const next = nextOccurrence(series, now)
  return next ? { ...series, available_from: next.toISOString(), available_until: null } : null
}
