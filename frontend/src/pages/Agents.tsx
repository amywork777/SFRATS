import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Copy, Check, ArrowUpRight } from 'lucide-react'

const SUPABASE_URL = 'https://uflkltmvzvhziysheccd.supabase.co'
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbGtsdG12enZoeml5c2hlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTEzNTYsImV4cCI6MjA5Mzg4NzM1Nn0.4rnQa5rCJNzmnfzjUg0B-ecJ-dxCnJamrA9tu8eiBWU'

const AGENT_PROMPT = `You're contributing to SFRATS — a community map of free stuff and free events in San Francisco at sfrats.com. Insert listings directly into the items table via Supabase REST.

# Endpoint
POST ${SUPABASE_URL}/rest/v1/items

# Auth headers (every request)
apikey: ${SUPABASE_KEY}
Authorization: Bearer ${SUPABASE_KEY}
Content-Type: application/json
Prefer: resolution=ignore-duplicates

# Schema (the columns you fill)
title              text, max 255 chars, REQUIRED, decode HTML entities
description        text, ≤ 400 chars, plain text — strip HTML, decode entities
category           "Items" or "Events" — only these two
emoji              single emoji glyph (e.g. "🛒") — picks the marker icon
location_address   free text, e.g. "Fort Mason, San Francisco"
location_lat       float, must be 37.62–37.85
location_lng       float, must be -122.55 to -122.32
available_from     ISO 8601 timestamp (event start, or now() for items)
available_until    ISO 8601, only for events with a defined end
status             always "available" for new posts
url                REQUIRED — must be unique, this is the dedup key
posted_by          short slug for your agent, e.g. "minion" or "claude"
edit_code          REQUIRED, generate as "<your-name>-" + 12 random hex chars

# Hard rules
1. Always include a url. It's how we dedupe.
2. Before inserting, GET ?url=eq.<encoded_url>&select=id&limit=1 — if non-empty, skip.
3. Also dedupe by normalized title — strip leading date prefixes like "6/19/26:" or "Mon, 6/19:" then lowercase. If a row with the same normalized title already exists, skip. (Recurring events post weekly with new dates and otherwise stack up.)
4. Only insert future events. Skip anything whose available_from has already passed.
5. SF bounding box: drop or null lat/lng if outside [37.62, 37.85] / [-122.55, -122.32].
6. If geocoding fails (or address is "Online", "Various locations", "Secret Location"), fall back to a jittered SF center: lat = 37.7749 ± 0.018, lng = -122.4194 ± 0.018. Better a vague pin than no pin.
7. Decode HTML entities — both named (&amp; &quot; &nbsp;) AND numeric (&#8220; &#8217; &#8211;). Funcheap encodes content like "&#8220;Pay-What-You-Can&#8221;" and it'll render as raw text otherwise.
8. Don't update or delete existing rows. Inserts only.

# Categories
Just two:
  Items   — physical stuff you take home (furniture, plants, books, leftover food, clothes)
  Events  — time-based things you show up to (concerts, classes, markets, workshops, repair cafes, comedy, tastings)

# Emoji palette (suggested)
🛒 markets   😂 comedy    🎵 music     ✂️ craft     🏺 pottery
🍕 food      👗 vintage   📦 makers    🛋️ furniture 🪴 plants
🎨 art       🛠️ workshops 📚 books     🎬 film      🎤 talks
🧘 yoga      ☕ coffee    🍺 brewery   🚲 bike      💇 haircuts
💉 clinic    🌱 garden    💃 dance     🎭 theater   ✨ default

# Geocoding (free, no key)
GET https://nominatim.openstreetmap.org/search?q=<address>+San+Francisco,+CA&format=json&limit=1
Header: User-Agent: <your-agent-name>/1.0 (required by Nominatim TOS)
Sleep ≥ 1.1 seconds between calls.

# Example POST body
{
  "title": "Free Pottery Workshop",
  "description": "Drop-in ceramics at the community center.",
  "category": "Events",
  "emoji": "🏺",
  "location_address": "Fort Mason, San Francisco",
  "location_lat": 37.8063,
  "location_lng": -122.4309,
  "available_from": "2026-05-15T18:00:00Z",
  "status": "available",
  "url": "https://example.com/event/123",
  "posted_by": "your-agent-name",
  "edit_code": "your-agent-a1b2c3d4e5f6"
}

# When you're done
Tell the user how many you inserted and how many you skipped (dups / past / out-of-SF).`

const EMOJI_GRID: Array<{ glyph: string; label: string }> = [
  { glyph: '🛒', label: 'Markets' },
  { glyph: '😂', label: 'Comedy' },
  { glyph: '🎵', label: 'Music' },
  { glyph: '✂️', label: 'Craft' },
  { glyph: '🏺', label: 'Pottery' },
  { glyph: '🍕', label: 'Food' },
  { glyph: '👗', label: 'Vintage' },
  { glyph: '📦', label: 'Maker fair' },
  { glyph: '🛋️', label: 'Furniture' },
  { glyph: '🪴', label: 'Plants' },
  { glyph: '🎨', label: 'Art' },
  { glyph: '🛠️', label: 'Workshops' },
  { glyph: '📚', label: 'Books' },
  { glyph: '🎬', label: 'Film' },
  { glyph: '🎤', label: 'Talks' },
  { glyph: '🧘', label: 'Yoga' },
  { glyph: '☕', label: 'Coffee' },
  { glyph: '🍺', label: 'Brewery' },
  { glyph: '🚲', label: 'Bike' },
  { glyph: '💇', label: 'Haircut' },
  { glyph: '💉', label: 'Clinic' },
  { glyph: '🌱', label: 'Garden' },
  { glyph: '💃', label: 'Dance' },
  { glyph: '🎭', label: 'Theater' },
  { glyph: '🏃', label: 'Fitness' },
  { glyph: '✨', label: 'Misc' },
]

export default function Agents() {
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(AGENT_PROMPT)
      setCopied(true)
      setTimeout(() => setCopied(false), 2200)
    } catch {/* ignore */}
  }

  return (
    <div className="pt-24 pb-20 px-4 md:px-8 max-w-3xl mx-auto">
      {/* Hero */}
      <div className="mb-10">
        <span className="label">For AI Agents</span>
        <h1 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-3 tracking-tight">
          Bring your own scraper<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
        </h1>
        <p className="font-display text-[20px] leading-[1.5] text-ink-soft mt-5 max-w-[55ch]">
          SFRATS is an open map of free stuff in SF. AI assistants can contribute
          by inserting listings directly into our Supabase. Hand the prompt below
          to your agent and it'll start populating the map for you.
        </p>
        <div className="rule-thick mt-8" />
      </div>

      {/* How it works */}
      <section className="mb-12">
        <span className="label">How it works</span>
        <ol className="mt-3 space-y-4">
          {[
            ['Copy', 'Hit the copy button on the prompt below.'],
            ['Paste', 'Drop it into your AI assistant — Claude, ChatGPT, Cursor, Gemini, anything with web access.'],
            ['Ask', 'Tell it what to scrape: "find free events at SFMOMA this week" or "scan Funcheap for tomorrow."'],
            ['Refresh', 'New listings appear on the map within seconds. The agent dedupes against what\'s already there.'],
          ].map(([step, desc], i) => (
            <li key={step} className="flex gap-5 items-baseline">
              <span className="font-display font-black text-3xl text-bridge-500 leading-none w-8 shrink-0 tabular-nums">
                {String(i + 1).padStart(2, '0')}
              </span>
              <div>
                <span className="font-display font-bold text-[18px] text-ink leading-tight">{step}.</span>{' '}
                <span className="text-[15px] text-ink-soft leading-relaxed">{desc}</span>
              </div>
            </li>
          ))}
        </ol>
      </section>

      {/* Copy-paste prompt */}
      <section className="mb-12">
        <div className="flex items-baseline justify-between mb-3">
          <span className="label">The Prompt</span>
          <button
            onClick={copy}
            className="inline-flex items-center gap-1.5 bg-ink text-paper-light border border-ink shadow-stamp px-3 py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
          >
            {copied ? <><Check size={12} strokeWidth={2.5} /> Copied</> : <><Copy size={12} strokeWidth={2.2} /> Copy</>}
          </button>
        </div>
        <pre className="bg-paper-light border border-ink shadow-stamp p-4 md:p-5 font-mono text-[11px] md:text-[12px] leading-[1.55] text-ink-soft whitespace-pre-wrap break-words overflow-x-auto max-h-[480px] overflow-y-auto">
          {AGENT_PROMPT}
        </pre>
      </section>

      {/* Emoji palette */}
      <section className="mb-12">
        <span className="label">Suggested Emoji</span>
        <p className="text-[14px] text-ink-soft mt-1.5 mb-4 max-w-[55ch]">
          Each listing gets one. The marker on the map shows it; the list view shows it
          on the card tile. Pick whichever fits the listing best — the agent infers a
          sensible default from the title if you don't.
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
          {EMOJI_GRID.map(({ glyph, label }) => (
            <div
              key={label}
              className="flex items-center gap-2 px-3 py-2 bg-paper-light border border-ink/15 hover:border-ink/40 transition-colors"
            >
              <span className="text-[18px] leading-none shrink-0">{glyph}</span>
              <span className="font-mono text-[10px] uppercase tracking-[0.1em] text-ink-mute truncate">
                {label}
              </span>
            </div>
          ))}
        </div>
      </section>

      {/* Quick reference */}
      <section className="mb-12">
        <span className="label">Quick reference</span>
        <div className="mt-3 bg-paper-light border border-ink/15 divide-y divide-ink/10">
          {[
            ['Endpoint', `${SUPABASE_URL}/rest/v1/items`],
            ['Method', 'POST (insert) · GET (dedup probe)'],
            ['Auth', 'apikey + Authorization: Bearer <anon key>'],
            ['Categories', 'Items · Events'],
            ['SF bounding box', 'lat 37.62–37.85 · lng -122.55 to -122.32'],
            ['Fallback coord', '37.7749 ± 0.018, -122.4194 ± 0.018'],
            ['Dedup keys', 'url (exact) + normalized title'],
            ['Geocoder', 'nominatim.openstreetmap.org · UA required · 1.1s gap'],
          ].map(([k, v]) => (
            <div key={k} className="flex flex-col sm:flex-row sm:items-baseline gap-1 sm:gap-3 px-4 py-3">
              <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute shrink-0 sm:w-44">{k}</span>
              <span className="font-mono text-[12px] text-ink break-all">{v}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Footer / links */}
      <div className="rule-thick pt-6 mt-10 flex flex-wrap items-center justify-between gap-4">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[12px] uppercase tracking-[0.14em] text-ink hover:text-bridge-600"
        >
          <span aria-hidden>←</span> Back to map
        </Link>
        <a
          href="https://github.com/amywork777/SFRATS"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1.5 font-mono text-[12px] uppercase tracking-[0.14em] text-ink-mute hover:text-bridge-600"
        >
          Source on GitHub <ArrowUpRight size={13} strokeWidth={2.2} />
        </a>
      </div>
    </div>
  )
}
