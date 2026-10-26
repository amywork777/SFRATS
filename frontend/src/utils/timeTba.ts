import { formatEventDate } from './dates'

export const TIME_TBA_MARKER = '[Time TBA]'
const MARKER_RE = /\s*\[(?:Time TBA|All Day)\]\s*/gi
const PT = 'America/Los_Angeles'

/** Convention: description contains [Time TBA]; available_from is PT midnight. */
export function isTimeTba(description: string | null | undefined): boolean {
  return !!description && /\[Time TBA\]/i.test(description)
}

/** Explicit all-day marker; same PT-midnight convention as Time TBA. */
export function isAllDay(description: string | null | undefined): boolean {
  return !!description && /\[All Day\]/i.test(description)
}

/** Either marker means no clock time is known or applicable. */
export function hasNoClock(description: string | null | undefined): boolean {
  return isTimeTba(description) || isAllDay(description)
}

/** Description with the marker removed, for display and calendar export. */
export function stripTimeTba(description: string | null | undefined): string {
  return (description ?? '').replace(MARKER_RE, ' ').trim()
}

/** Date text; when time is TBA drops any clock part and says "Time TBA". */
export function formatEventWhen(
  value: string | number | Date | null | undefined,
  description: string | null | undefined,
  fmt = 'MMM d · h:mm a',
): string {
  if (!hasNoClock(description)) return formatEventDate(value, fmt)
  const label = isAllDay(description) ? 'All day' : 'Time TBA'
  const dateFmt = fmt.replace(/\s*[·,–-]?\s*h:mm a/, '').trim()
  if (!dateFmt) return label
  const d = formatEventDate(value, dateFmt, '')
  return d ? `${d} · ${label}` : 'Date TBA'
}

/** YYYY-MM-DD of an instant in Pacific time. */
export function ptDay(value: string | number | Date): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: PT, year: 'numeric', month: '2-digit', day: '2-digit' }).format(new Date(value))
}

/** Next PT calendar day, as YYYY-MM-DD (for all-day DTEND, exclusive). */
export function nextPtDay(value: string | number | Date): string {
  const [y, m, d] = ptDay(value).split('-').map(Number)
  return new Date(Date.UTC(y, m - 1, d + 1)).toISOString().slice(0, 10)
}

/** Instant of the end of the PT day containing value (start of next PT day). */
export function endOfPtDay(value: string | number | Date): number {
  const [y, m, d] = nextPtDay(value).split('-').map(Number)
  let t = Date.UTC(y, m - 1, d, 8)
  for (let i = 0; i < 3; i++) {
    const p = Object.fromEntries(new Intl.DateTimeFormat('en-CA', { timeZone: PT, year: 'numeric', month: '2-digit', day: '2-digit', hour: '2-digit', minute: '2-digit', hourCycle: 'h23' }).formatToParts(new Date(t)).map(x => [x.type, x.value]))
    const delta = Date.UTC(y, m - 1, d) - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute)
    if (!delta) break
    t += delta
  }
  return t
}
