import { DbItem } from '../types/supabase'
import { inferEmoji } from './categoryIcons'

// User-facing event types for the map/list filter. Type is DERIVED from each
// event's emoji (item.emoji, or the inferred one) — no DB column needed, so
// this works on every existing row instantly. Keep in sync with the emoji
// rules in categoryIcons.tsx.
export interface EventType {
  key: string
  label: string
  emoji: string
}

export const EVENT_TYPES: EventType[] = [
  { key: 'music',     label: 'Music',             emoji: '🎵' },
  { key: 'arts',      label: 'Arts & Culture',    emoji: '🎨' },
  { key: 'markets',   label: 'Markets & Fashion', emoji: '🛍️' },
  { key: 'food',      label: 'Food & Drink',      emoji: '🍴' },
  { key: 'tech',      label: 'Tech',              emoji: '💻' },
  { key: 'other',     label: 'Other',             emoji: '✨' },
]

// Strip emoji variation selectors (U+FE0F) so '✂️' and '✂' both match.
const strip = (s: string) => s.replace(/️/g, '')

// Which glyphs roll up into each type. Anything not listed falls to 'other'.
const GLYPH_TO_TYPE: Record<string, string> = {}
const assign = (key: string, glyphs: string[]) =>
  glyphs.forEach(g => { GLYPH_TO_TYPE[strip(g)] = key })

// Keep these glyphs in sync with the "Emoji guide" in pages/Agents.tsx — that
// guide is what the scraper agents pick from, so every glyph they can emit must
// roll up to a chip here or the event silently lands in 'other'.
assign('music',     ['🎵', '💃', '🪩', '⚡', '🥁', '🔊', '🖤', '🏭']) // music, dance, disco, techno, dnb, bass, goth, warehouse/rave
assign('arts',      ['🎨', '🎬', '📖', '🖨️', '🏺', '😂', '🎭', '🏛️', '📚', '🛠️', '🔧', '✂️']) // art, film, books, print, pottery, comedy, theater, museum, workshops, repair, craft
assign('markets',   ['🛒', '📦', '🛍️', '👗', '👕', '💇'])         // markets, maker fairs, pop-ups, thrift/vintage, clothing, beauty
assign('food',      ['🍕', '🍳', '☕', '🍺', '🍱', '🍽️', '🍴'])    // food + drink
assign('tech',      ['🤖', '💻', '🚀', '🤝'])                     // AI, hackathon, startup/pitch, networking
// everything else (🎉 festival, 🎤 talk, 🚶 tour, 🚲 bike, 🧘 wellness,
// 💉 health, ⚖️ legal, 🌱 garden, 📅/✨/✿ default) → 'other'

/** Roll a listing up to one of the user-facing EVENT_TYPES keys. */
export function eventType(
  item: Pick<DbItem, 'emoji' | 'title' | 'description' | 'category'>,
): string {
  const glyph = item.emoji || inferEmoji(item.title, item.description ?? null, item.category)
  return GLYPH_TO_TYPE[strip(glyph)] ?? 'other'
}
