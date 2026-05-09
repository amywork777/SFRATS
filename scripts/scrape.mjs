// Weekly SFRATS scraper. Runs in GitHub Actions on Node 20.
// Pulls free-stuff posts from 3 SF sources, dedupes against the items table,
// and inserts new rows via Supabase REST.

const SUPABASE_URL = process.env.SUPABASE_URL
const ANON = process.env.SUPABASE_ANON_KEY
if (!SUPABASE_URL || !ANON) {
  console.error('Missing SUPABASE_URL or SUPABASE_ANON_KEY env')
  process.exit(1)
}

const REST = `${SUPABASE_URL}/rest/v1/items`
const HEADERS = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  'Content-Type': 'application/json',
}

const SF_BBOX = { latMin: 37.62, latMax: 37.85, lngMin: -122.55, lngMax: -122.32 }

// Many sources (Funcheap especially) re-post recurring events once per
// occurrence — 3x "Pay-What-You-Can Taco Day", 5x "HellaSecret Comedy",
// etc. We dedupe on the title-after-the-date-prefix so the user sees
// each event once.
const normalizeTitle = (t = '') => t
  .replace(/^\s*(?:[A-Za-z]{3,9},?\s+)?\d{1,2}\/\d{1,2}\/\d{2,4}\s*[:\-–—]?\s*/, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

let existingTitles = new Set()

const counts = {
  funcheap:   { fetched: 0, inserted: 0, dup: 0, nolocation: 0, error: 0 },
  reddit:     { fetched: 0, inserted: 0, dup: 0, nolocation: 0, error: 0 },
  eventbrite: { fetched: 0, inserted: 0, dup: 0, nolocation: 0, error: 0 },
}

const PER_RUN_CAP = 30
const PER_SOURCE_CAP = 15
let totalInserted = 0

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Decode every kind of HTML entity Funcheap throws at us, including
// numeric ones like &#8220; (left smart quote), &#8217; (apostrophe),
// &#8211; (en-dash), and hex variants.
const NAMED = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", nbsp: ' ' }
const decodeEntities = (s = '') =>
  s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, code) => {
    if (code[0] === '#') {
      const cp = code[1] === 'x' || code[1] === 'X'
        ? parseInt(code.slice(2), 16)
        : parseInt(code.slice(1), 10)
      return Number.isFinite(cp) ? String.fromCodePoint(cp) : m
    }
    return NAMED[code.toLowerCase()] ?? m
  })

// IMPORTANT: decode entities FIRST so encoded HTML like &lt;p&gt;...&lt;/p&gt;
// becomes real tags that we can then strip. Doing it the other way around
// leaves the encoded tags intact and they re-emerge as text after decoding.
const stripHtml = (s = '') =>
  decodeEntities(s)
    .replace(/<!\[CDATA\[(.*?)\]\]>/gs, '$1')
    .replace(/<[^>]*>/g, '')
    .replace(/\s+/g, ' ')
    .trim()

const xmlExtractAll = (xml, tag) => {
  const re = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)<\\/${tag}>`, 'g')
  const out = []
  let m
  while ((m = re.exec(xml)) !== null) out.push(m[1])
  return out
}
const xmlExtractFirst = (xml, tag) => xmlExtractAll(xml, tag)[0] ?? ''

const randHex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')

async function alreadyInDb(url) {
  const u = `${REST}?url=eq.${encodeURIComponent(url)}&select=id&limit=1`
  const res = await fetch(u, { headers: HEADERS })
  if (!res.ok) return false
  const rows = await res.json()
  return Array.isArray(rows) && rows.length > 0
}

async function geocode(address) {
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(address + ', San Francisco, CA')}&format=json&limit=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'sfrats-scraper/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

function inSfBbox(lat, lng) {
  return lat >= SF_BBOX.latMin && lat <= SF_BBOX.latMax && lng >= SF_BBOX.lngMin && lng <= SF_BBOX.lngMax
}

// Fallback for SF events whose venue can't be precisely geocoded
// ("Secret Location (SF)", sparse venue names, etc.) — drop a jittered
// pin near SF center so the listing still appears on the map.
function jitteredSfCenter() {
  return {
    lat: 37.7749 + (Math.random() - 0.5) * 0.036,  // ~±2km
    lng: -122.4194 + (Math.random() - 0.5) * 0.036,
  }
}

async function tryInsert(source, row) {
  if (totalInserted >= PER_RUN_CAP) return 'cap'
  if (counts[source].inserted >= PER_SOURCE_CAP) return 'cap'

  if (!row.title || !row.url) {
    counts[source].error++
    return 'invalid'
  }
  if (await alreadyInDb(row.url)) {
    counts[source].dup++
    return 'dup'
  }
  // Title-level dedupe across recurring occurrences
  const normTitle = normalizeTitle(row.title)
  if (normTitle && existingTitles.has(normTitle)) {
    counts[source].dup++
    return 'dup'
  }

  // Geocode if needed
  if ((!row.location_lat || !row.location_lng) && row.location_address) {
    const geo = await geocode(row.location_address)
    if (geo) {
      row.location_lat = geo.lat
      row.location_lng = geo.lng
    }
    await sleep(1100) // Nominatim TOS rate limit
  }
  if (row.location_lat && row.location_lng && !inSfBbox(row.location_lat, row.location_lng)) {
    row.location_lat = null
    row.location_lng = null
  }

  // If we still have no coords after geocoding, fall back to a jittered
  // SF center so the marker still appears on the map. Better than hiding
  // the listing entirely.
  if (!row.location_lat || !row.location_lng) {
    const c = jitteredSfCenter()
    row.location_lat = c.lat
    row.location_lng = c.lng
  }

  // POST
  const res = await fetch(REST, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify({
      title: row.title.slice(0, 255),
      description: row.description ?? null,
      category: row.category,
      location_address: row.location_address ?? null,
      location_lat: row.location_lat ?? null,
      location_lng: row.location_lng ?? null,
      available_from: row.available_from ?? new Date().toISOString(),
      status: 'available',
      url: row.url,
      posted_by: row.posted_by,
      edit_code: 'scraper-' + randHex(12),
    }),
  })
  if (res.status === 201) {
    counts[source].inserted++
    totalInserted++
    if (normTitle) existingTitles.add(normTitle)
    return 'ok'
  }
  if (res.status === 409) {
    counts[source].dup++
    return 'dup'
  }
  counts[source].error++
  console.error(`[${source}] insert ${res.status}: ${await res.text().catch(() => '')}`)
  return 'err'
}

// Pull every <script type="application/ld+json"> JSON block from a page.
function extractLdJson(html) {
  const out = []
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
  let m
  while ((m = re.exec(html)) !== null) {
    try {
      const j = JSON.parse(m[1])
      const arr = Array.isArray(j) ? j : [j]
      for (const c of arr) {
        out.push(c)
        if (c?.['@graph']) for (const g of c['@graph']) out.push(g)
      }
    } catch { /* skip bad block */ }
  }
  return out
}

// Look up an Event's location on its full page (Funcheap embeds structured data per post).
async function fetchEventLocation(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; sfrats-scraper/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) return null
    const html = await res.text()
    const ld = extractLdJson(html)
    const ev = ld.find((c) => c?.['@type'] === 'Event' || (Array.isArray(c?.['@type']) && c['@type'].includes('Event')))
    if (!ev) return null
    const loc = ev.location ?? {}
    const addr = loc.address ?? {}
    const parts = [
      loc.name,
      addr.streetAddress,
      addr.addressLocality,
      addr.addressRegion,
      addr.postalCode,
    ].filter(Boolean)
    const address = parts.join(', ') || (typeof loc === 'string' ? loc : null)
    return {
      address: address || null,
      lat: loc.geo?.latitude  ? parseFloat(loc.geo.latitude)  : null,
      lng: loc.geo?.longitude ? parseFloat(loc.geo.longitude) : null,
    }
  } catch {
    return null
  }
}

// ──────────────── 1) Funcheap RSS ────────────────
async function scrapeFuncheap() {
  console.log('--- Funcheap ---')
  try {
    const res = await fetch('https://sf.funcheap.com/feed/', {
      headers: { 'User-Agent': 'sfrats-scraper/1.0' },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const xml = await res.text()
    const items = xmlExtractAll(xml, 'item').slice(0, 20)
    counts.funcheap.fetched = items.length
    for (const item of items) {
      if (totalInserted >= PER_RUN_CAP || counts.funcheap.inserted >= PER_SOURCE_CAP) break
      const title = stripHtml(xmlExtractFirst(item, 'title'))
      const link  = stripHtml(xmlExtractFirst(item, 'link'))
      const pub   = xmlExtractFirst(item, 'pubDate')
      const desc  = stripHtml(xmlExtractFirst(item, 'content:encoded') || xmlExtractFirst(item, 'description')).slice(0, 240)
      if (!title || !link) continue

      // Fetch the per-event page to pull structured location data
      const loc = await fetchEventLocation(link)
      // Be polite to Funcheap
      await sleep(300)

      await tryInsert('funcheap', {
        title, description: desc, url: link,
        category: 'Events', posted_by: 'funcheap',
        available_from: pub ? new Date(pub).toISOString() : null,
        location_address: loc?.address ?? null,
        location_lat:    loc?.lat ?? null,
        location_lng:    loc?.lng ?? null,
      })
    }
  } catch (e) {
    console.error('Funcheap error:', e.message)
    counts.funcheap.error++
  }
}

// ──────────────── 2) Reddit r/sanfrancisco JSON ────────────────
async function scrapeReddit() {
  console.log('--- Reddit ---')
  // Reddit gates JSON behind a User-Agent — they want this exact shape.
  // Try old.reddit.com first (more permissive), then www.
  const UA = 'web:sfrats-scraper:v1.0 (by /u/amywork777)'
  const urls = [
    'https://old.reddit.com/r/sanfrancisco/search.json?q=free&sort=new&restrict_sr=1&limit=25',
    'https://www.reddit.com/r/sanfrancisco/search.json?q=free&sort=new&restrict_sr=1&limit=25',
  ]
  try {
    let data = null
    let lastStatus = 0
    for (const url of urls) {
      const res = await fetch(url, {
        headers: { 'User-Agent': UA, 'Accept': 'application/json' },
        redirect: 'follow',
      })
      lastStatus = res.status
      if (res.ok) { data = await res.json(); break }
    }
    if (!data) throw new Error(`HTTP ${lastStatus}`)
    const kids = data?.data?.children ?? []
    counts.reddit.fetched = kids.length
    const SKIP = ['looking for', 'asking', 'iso ', 'wanted', 'in search of', 'where can i find']
    // Two-bucket categorization: Events = anything time-based you go to;
    // Items = anything physical you take home (incl. leftover food, books, plants).
    const EVENT_RE = /(concert|festival|workshop|meetup|class|lesson|tasting|tour|pop-?up|repair caf|panel|open mic|movie night|free entry|free admission|free yoga|free haircut|free clinic|free vaccin)/i

    for (const k of kids) {
      if (totalInserted >= PER_RUN_CAP || counts.reddit.inserted >= PER_SOURCE_CAP) break
      const d = k.data
      const title = (d.title || '').slice(0, 255)
      const text  = (d.selftext || '').slice(0, 400)
      const lower = (title + ' ' + text).toLowerCase()
      if (SKIP.some(p => lower.includes(p))) continue
      const url = `https://reddit.com${d.permalink}`
      const created = d.created_utc ? new Date(d.created_utc * 1000).toISOString() : null
      const category = EVENT_RE.test(lower) ? 'Events' : 'Items'
      await tryInsert('reddit', {
        title, description: text || null, url, category,
        posted_by: 'reddit', available_from: created,
      })
    }
  } catch (e) {
    console.error('Reddit error:', e.message)
    counts.reddit.error++
  }
}

// ──────────────── 3) Eventbrite SF free events HTML ────────────────
async function scrapeEventbrite() {
  console.log('--- Eventbrite ---')
  try {
    const res = await fetch('https://www.eventbrite.com/d/ca--san-francisco/free--events/', {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; sfrats-scraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    // Pull every application/ld+json block, find @type=Event entries.
    const ldRe = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g
    const events = []
    let m
    while ((m = ldRe.exec(html)) !== null) {
      try {
        const j = JSON.parse(m[1])
        const candidates = Array.isArray(j) ? j : [j]
        for (const c of candidates) {
          if (c?.['@type'] === 'Event' && c.url && c.name) events.push(c)
          if (c?.['@graph']) {
            for (const g of c['@graph']) {
              if (g?.['@type'] === 'Event' && g.url && g.name) events.push(g)
            }
          }
        }
      } catch { /* tolerate one bad block */ }
    }

    counts.eventbrite.fetched = events.length
    for (const ev of events) {
      if (totalInserted >= PER_RUN_CAP || counts.eventbrite.inserted >= PER_SOURCE_CAP) break
      const loc = ev.location ?? {}
      const addr = loc.address ?? {}
      const address = [loc.name, addr.streetAddress, addr.addressLocality, addr.postalCode]
        .filter(Boolean).join(', ')
      await tryInsert('eventbrite', {
        title: stripHtml(ev.name).slice(0, 255),
        description: stripHtml(ev.description || '').slice(0, 240) || null,
        url: ev.url,
        category: 'Events',
        posted_by: 'eventbrite',
        available_from: ev.startDate ? new Date(ev.startDate).toISOString() : null,
        location_address: address || null,
        location_lat: addr.latitude ? parseFloat(addr.latitude) : (loc.geo?.latitude  ? parseFloat(loc.geo.latitude)  : null),
        location_lng: addr.longitude ? parseFloat(addr.longitude) : (loc.geo?.longitude ? parseFloat(loc.geo.longitude) : null),
      })
    }
  } catch (e) {
    console.error('Eventbrite error:', e.message)
    counts.eventbrite.error++
  }
}

// ──────────────── Run all + summary ────────────────
;(async () => {
  const t0 = Date.now()

  // Pre-load existing titles for cross-run dedupe (recurring events)
  try {
    const res = await fetch(`${REST}?select=title&posted_by=neq.scraper-meta&limit=1000`, { headers: HEADERS })
    if (res.ok) {
      const rows = await res.json()
      for (const r of rows) {
        const n = normalizeTitle(r.title)
        if (n) existingTitles.add(n)
      }
      console.log(`pre-loaded ${existingTitles.size} existing titles for dedupe`)
    }
  } catch (e) {
    console.error('pre-load failed (continuing):', e.message)
  }

  await scrapeFuncheap()
  await scrapeReddit()
  await scrapeEventbrite()

  const summary =
    `=== SFRATS scrape summary ===\n` +
    Object.entries(counts).map(([s, c]) =>
      `${s.padEnd(11, ' ')} fetched=${c.fetched} inserted=${c.inserted} dup=${c.dup} nolocation=${c.nolocation} error=${c.error}`
    ).join('\n') +
    `\ntotal inserts: ${totalInserted}\n` +
    `runtime: ${((Date.now() - t0) / 1000).toFixed(1)}s`

  console.log('\n' + summary)

  // Also write a meta row to items so the result is queryable from the app DB
  await fetch(REST, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify({
      title: '__SCRAPER_RUN__ ' + new Date().toISOString(),
      description: summary,
      category: 'Services',
      status: 'available',
      posted_by: 'scraper-meta',
      edit_code: 'scraper-meta-' + randHex(8),
      url: null,
    }),
  }).catch(() => {})

  process.exit(0)
})()
