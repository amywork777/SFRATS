import { EVENT_TYPES } from '../utils/eventTypes'
import { inferEmoji } from '../utils/categoryIcons'
import type { DbItem } from '../types/supabase'

type EmojiItem = Pick<DbItem, 'emoji' | 'title' | 'description' | 'category'>
// Presentation choices stay separate from stored glyphs used by type filters.
// Prefer a specific activity over a generic calendar, without rewriting events.
const playfulGlyph = (glyph: string) => ({ '🛒': '🛍️', '📦': '🛍️', '🧠': '🧩' }[glyph] || glyph)
const activityGlyph = (title: string) => {
  if (/\b(trivia|quiz)\b/i.test(title)) return '🧩'
  if (/\b(bingo|games?|game\s*night)\b/i.test(title)) return '🎲'
  if (/\b(chess)\b/i.test(title)) return '♟️'
  if (/\b(photo\w*|camera)\b/i.test(title)) return '📸'
  if (/\b(knit\w*|crochet|sewing|embroidery|weaving)\b/i.test(title)) return '🧶'
  if (/\b(hike|hiking|trail)\b/i.test(title)) return '🥾'
  if (/\b(run|running|jog|jogging)\b/i.test(title)) return '👟'
  if (/\b(ai|robot|hackathon|coding)\b/i.test(title)) return '🤖'
  if (/\b(networking|career|job)\b/i.test(title)) return '🤝'
  return inferEmoji(title, '', 'Events')
}
const isCalendar = (glyph: string) => ['📅', '📆', '🗓', '🗓️'].includes(glyph)
export function eventEmoji(item: EmojiItem) {
  const stored = item.emoji || inferEmoji(item.title, item.description, item.category)
  if (!isCalendar(stored)) return playfulGlyph(stored)
  const specific = activityGlyph(item.title || '')
  if (!isCalendar(specific)) return playfulGlyph(specific)
  const inferred = inferEmoji('', item.description, item.category)
  return isCalendar(inferred) ? '✨' : playfulGlyph(inferred)
}

// Amy explicitly prefers friendly category emoji over the monochrome icon set.
const emojiFor = (type: string) => EVENT_TYPES.find(item => item.key === type)?.emoji || '✨'
export function EventIcon({ type, emoji, size = 18 }: { type: string; emoji?: string; size?: number }) {
  return <span className="event-emoji" style={{ fontSize: size }} aria-hidden="true">{emoji || emojiFor(type)}</span>
}
export function markerGlyph(type: string, emoji?: string) {
 // Escape stored emoji before inserting it into Leaflet marker HTML.
 const glyph = (emoji || emojiFor(type)).replace(/[&<>"']/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char]!))
 return `<span class="event-emoji" aria-hidden="true">${glyph}</span>`
}
