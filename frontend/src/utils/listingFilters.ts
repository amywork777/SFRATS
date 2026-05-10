import { DbItem } from '../types/supabase'

const DAY_MS  = 24 * 60 * 60 * 1000
const ITEM_TTL_DAYS = 30

/**
 * Whether a listing should still appear on the map / in lists.
 *
 * Auto-expiry rules:
 * - If `available_until` exists and has passed → expired.
 * - Otherwise, for Events: hide once `available_from + 24 h` is in the past
 *   (most events are single-day; we give a one-day grace window).
 * - Otherwise, for Items: hide once `created_at + 30 days` is in the past
 *   (free items don't sit on a curb forever).
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

  if (item.category === 'Items' && item.created_at) {
    const created = new Date(item.created_at).getTime()
    return created + ITEM_TTL_DAYS * DAY_MS >= t
  }

  return true
}
