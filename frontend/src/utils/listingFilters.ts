import { DbItem } from '../types/supabase'

const DAY_MS  = 24 * 60 * 60 * 1000

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
 * - If `available_until` exists and has passed → expired.
 * - Otherwise, for Events: hide once `available_from + 24 h` is in the past
 *   (most events are single-day; we give a one-day grace window).
 * - Anything else (no dates at all) stays visible.
 */
export function isActive(item: DbItem, now: Date = new Date()): boolean {
  const t = now.getTime()

  if (item.available_until) {
    return new Date(item.available_until).getTime() >= t
  }

  if (item.category === 'Events' && item.available_from) {
    const start = new Date(item.available_from).getTime()
    return start + DAY_MS >= t
  }

  return true
}
