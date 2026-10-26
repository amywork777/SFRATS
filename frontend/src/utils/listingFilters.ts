import type { DbItem } from '../types/supabase'

import { projectOccurrence } from './recurrence'
import { hasNoClock, isAllDay, isTimeTba, endOfPtDay } from './timeTba'

const DAY_MS = 12 * 60 * 60 * 1000

export const MILE_KM = 1.609344

/** Haversine distance between two lat/lng points, in km. */
export function distanceKm(
  aLat: number, aLng: number,
  bLat: number, bLng: number
): number {
  const R = 6371
  const toRad = (d: number) => (d * Math.PI) / 180
  const dLat = toRad(bLat - aLat)
  const dLng = toRad(bLng - aLng)
  const s = Math.sin(dLat / 2) ** 2
          + Math.cos(toRad(aLat)) * Math.cos(toRad(bLat)) * Math.sin(dLng / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(s))
}

export function withinRadius(
  item: Pick<DbItem, 'location_lat' | 'location_lng'>,
  centerLat: number, centerLng: number,
  radiusKm: number
): boolean {
  if (!item.location_lat || !item.location_lng) return false
  return distanceKm(centerLat, centerLng, item.location_lat, item.location_lng) <= radiusKm
}

/**
 * Whether a listing should still appear on the map / in lists.
 *
 * Auto-expiry rules:
 * - Only available Events are public listings.
 * - Every event needs a valid start date.
 * - If `available_until` exists and has passed, the event is expired.
 * - Otherwise hide it 12 hours after its start.
 */
export function isActive(item: DbItem, now: Date = new Date()): boolean {
  if (item.title === '__SCRAPER_RUN__') return false
  if (item.category !== 'Events' || item.status !== 'available') return false
  const start = new Date(item.available_from ?? '').getTime()
  if (!Number.isFinite(start)) return false
  if (hasNoClock(item.description)) {
    const dayEnd = endOfPtDay(start)
    const until = item.available_until ? new Date(item.available_until).getTime() : NaN
    return Math.max(dayEnd, Number.isFinite(until) ? until : 0) > now.getTime()
  }
  if (item.available_until) {
    const end = new Date(item.available_until).getTime()
    return Number.isFinite(end) && end >= now.getTime()
  }
  return start + DAY_MS >= now.getTime()
}

const normalizedTitle = (title: string) =>
  title.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim()
const eventDay = (item: DbItem) =>
  new Date(item.available_from as string).toISOString().slice(0, 10)

/** Display-only quality rules; rows remain archived in Supabase. */
export function visibleEvents(items: DbItem[], now: Date = new Date()): DbItem[] {
  const newestFirst = items.map(item => projectOccurrence(item, now)).filter((item): item is DbItem => item !== null && isActive(item, now)).sort((a, b) => {
    const created = new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    if (Number.isFinite(created) && created !== 0) return created
    return Number(b.id) - Number(a.id)
  })
  const seen = new Set<string>()
  return newestFirst.filter(item => {
    const key = `${normalizedTitle(item.title)}|${eventDay(item)}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}
