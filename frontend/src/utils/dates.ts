import { format } from 'date-fns'

/**
 * Coerce a value to a valid Date, or null. Guards against the cases that
 * otherwise render as "Jan 1, 1970" (`new Date(null)`) or throw inside
 * date-fns (`new Date(undefined)` / empty string → Invalid Date).
 */
export function safeDate(value: string | number | Date | null | undefined): Date | null {
  if (value === null || value === undefined || value === '') return null
  const d = value instanceof Date ? value : new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/**
 * Format an event date, falling back to a placeholder when the date is
 * missing or invalid (events without a known date — see scraper accuracy).
 */
export function formatEventDate(
  value: string | number | Date | null | undefined,
  fmt = 'MMM d · h:mm a',
  fallback = 'Date TBA',
): string {
  const d = safeDate(value)
  return d ? format(d, fmt) : fallback
}
