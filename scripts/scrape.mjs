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

// Bay Area bounding box. SFRATS expanded from SF-only to the whole Bay Area,
// so geocoding + validation must accept the East Bay, North Bay, Peninsula and
// South Bay — not just the city. The old SF-only box silently nulled the
// coordinates of every Oakland / Berkeley / San Jose / Vallejo event.
const BAY_BBOX = { latMin: 37.1, latMax: 38.5, lngMin: -122.8, lngMax: -121.5 }

// Many sources (Funcheap especially) re-post recurring events once per
// occurrence — 3x "Pay-What-You-Can Taco Day", 5x "HellaSecret Comedy",
// etc. We dedupe on the title-after-the-date-prefix so the user sees
// each event once.
const TITLE_DATE_RE = /^\s*(?:[A-Za-z]{3,9},?\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*[:\-–—]?\s*/

const normalizeTitle = (t = '') => t
  .replace(TITLE_DATE_RE, '')
  .replace(/\s+/g, ' ')
  .trim()
  .toLowerCase()

// Funcheap prefixes recurring posts with the actual event date — e.g.
// "7/10/26: Free Comedy Night …". Lift that into a real ISO date so we
// stop conflating "post date" with "event date" on the map. Returns
// midnight local (we don't get a time of day from the prefix alone).
function parseTitleDate(title = '', fallbackYear = new Date().getFullYear()) {
  const m = TITLE_DATE_RE.exec(title)
  if (!m) return null
  const month = parseInt(m[1], 10)
  const day   = parseInt(m[2], 10)
  let year    = m[3] ? parseInt(m[3], 10) : fallbackYear
  if (year < 100) year += 2000
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  // 12:00 noon SF time so the map's date filter (which compares whole
  // days) lands on the right calendar day regardless of UTC offset.
  const d = new Date(Date.UTC(year, month - 1, day, 19, 0, 0))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const stripTitleDate = (t = '') => t.replace(TITLE_DATE_RE, '').trim()

let existingTitles = new Set()

const counts = {
  funcheap:   { fetched: 0, inserted: 0, dup: 0, nodate: 0, nolocation: 0, error: 0 },
  reddit:     { fetched: 0, inserted: 0, dup: 0, nodate: 0, nolocation: 0, error: 0 },
  eventbrite: { fetched: 0, inserted: 0, dup: 0, nodate: 0, nolocation: 0, error: 0 },
  dothebay:   { fetched: 0, inserted: 0, dup: 0, nodate: 0, nolocation: 0, error: 0 },
}

const PER_RUN_CAP = 30
const PER_SOURCE_CAP = 15
let totalInserted = 0

const sleep = (ms) => new Promise(r => setTimeout(r, ms))

// Pick a contextual emoji based on title + description keywords.
// Mirror of inferEmoji() in frontend/src/utils/categoryIcons.tsx — keep in sync.
const EMOJI_RULES = [
  [/\b(pottery|ceram(ic|ist)|clay)\b/i,                                '🏺'],
  [/\b(market|marketplace|flea\s*market|bazaar|swap\s*meet|vendor)\b/i, '🛒'],
  [/\b(comedy|standup|stand-?up|open\s*mic|improv|sketch)\b/i,         '😂'],
  [/\b(vintage|thrift|secondhand|second-?hand|estate\s*sale)\b/i,      '👗'],
  [/\b(makers?\s*fair|maker\s*market|maker)\b/i,                        '📦'],
  [/\b(craft|knit(ting)?|sewing|embroidery|crochet|weaving)\b/i,        '✂️'],
  [/\b(zine|print|risograph|riso|letterpress|silk\s*screen|screen\s*print)\b/i, '🖨️'],
  [/\b(music|concert|dj|band|jazz|opera|symphony|orchestra|choir|live\s*music|gig)\b/i, '🎵'],
  [/\b(dance|salsa|tango|disco|rave)\b/i,                               '💃'],
  [/\b(film|movie|screening|cinema|premiere)\b/i,                       '🎬'],
  [/\b(art|gallery|painting|sculpt|exhibition|exhibit|opening)\b/i,     '🎨'],
  [/\b(book|reading|poetry|author|literature|library|zine\s*release)\b/i, '📖'],
  [/\b(workshop|class|lesson|course|seminar)\b/i,                       '🛠️'],
  [/\b(repair\s*caf|fix-?it|bike\s*repair)\b/i,                         '🔧'],
  [/\b(yoga|meditation|qigong|tai\s*chi|breathwork)\b/i,                '🧘'],
  [/\b(pizza|tacos?|burrito|dim\s*sum|sushi|ramen)\b/i,                 '🍕'],
  [/\b(brunch|breakfast|lunch|dinner|supper)\b/i,                       '🍳'],
  [/\b(coffee|caf[eé]|espresso|latte)\b/i,                              '☕'],
  [/\b(beer|brewery|happy\s*hour|wine|tasting|cocktail)\b/i,            '🍺'],
  [/\b(food|snack|catering|leftover|free\s*food|free\s*meal)\b/i,       '🍱'],
  [/\b(party|festival|celebration|fest\b|fiesta|gala|carnival)\b/i,     '🎉'],
  [/\b(panel|talk|lecture|conference|symposium|keynote)\b/i,            '🎤'],
  [/\b(tour|walking\s*tour|history\s*walk)\b/i,                         '🚶'],
  [/\b(bike|biking|cycling|cyclist)\b/i,                                '🚲'],
  [/\b(haircut|salon|beauty|nail|barber)\b/i,                           '💇'],
  [/\b(vaccin|flu\s*shot|clinic|health\s*screening|blood\s*drive)\b/i,  '💉'],
  [/\b(legal|lawyer|attorney|tenant|housing)\b/i,                       '⚖️'],
  [/\b(furniture|couch|sofa|chair|table|desk|dresser|shelv|bookcase)\b/i, '🛋️'],
  [/\b(plant|succulent|cactus|monstera|cutting)\b/i,                    '🪴'],
  [/\b(garden|gardening|compost|seed)\b/i,                              '🌱'],
  [/\b(books?\s*(for|free)|free\s*books?)\b/i,                          '📚'],
  [/\b(clothes|clothing|shirt|jacket|dress|shoes)\b/i,                  '👕'],
  [/\b(electronics?|laptop|monitor|cable|kitchen|appliance)\b/i,        '🔌'],
  [/\b(curb\s*alert|sidewalk\s*score|free\s*pile|free\s*stuff)\b/i,     '🚮'],
]

function inferEmoji(title = '', description = '', category = '') {
  const text = `${title} ${description}`
  for (const [re, emoji] of EMOJI_RULES) {
    if (re.test(text)) return emoji
  }
  if (category === 'Events') return '📅'
  if (category === 'Items')  return '📦'
  return '✿'
}

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

// A "placeable" address has a street number or a venue name — something more
// specific than a bare city. Geocoding "San Francisco, CA" only returns the
// city centroid, which stacks unrelated events on one fake point. We'd rather
// leave such events unpinned (they still show in the list).
function isPlaceable(address = '') {
  const a = address.trim()
  if (!a) return false
  if (/\d{2,}\s+\w/.test(a)) return true // has a street number
  // strip city/state/country tokens; anything left is a venue/street name
  const rest = a
    .replace(/\b(san\s*francisco|oakland|berkeley|san\s*jose|bay\s*area|ca|california|usa|united states)\b/gi, '')
    .replace(/[\s,]+/g, '')
  return rest.length > 0
}

async function geocode(address) {
  // Don't double-append the state if the address already names it. We no longer
  // force "San Francisco" — the event may be anywhere in the Bay Area.
  const hasState = /,\s*ca\b|california/i.test(address)
  const q = hasState ? address : `${address}, CA`
  // Bias + restrict results to the Bay Area box so a bare street name
  // ("123 Main St") can't match an identically-named street elsewhere.
  const viewbox = `${BAY_BBOX.lngMin},${BAY_BBOX.latMax},${BAY_BBOX.lngMax},${BAY_BBOX.latMin}`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}`
    + `&format=json&limit=1&countrycodes=us&viewbox=${viewbox}&bounded=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'sfrats-scraper/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

function inBayBbox(lat, lng) {
  return lat >= BAY_BBOX.latMin && lat <= BAY_BBOX.latMax && lng >= BAY_BBOX.lngMin && lng <= BAY_BBOX.lngMax
}

async function tryInsert(source, row) {
  if (totalInserted >= PER_RUN_CAP) return 'cap'
  if (counts[source].inserted >= PER_SOURCE_CAP) return 'cap'

  if (!row.title || !row.url) {
    counts[source].error++
    return 'invalid'
  }
  // Events must carry a real date. We used to stamp `now` on anything
  // undated, which put events on the map claiming to happen "today".
  // Skip instead so we never publish a fabricated date.
  if (row.category === 'Events' && !row.available_from) {
    counts[source].nodate++
    return 'nodate'
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

  // Geocode if needed — but ONLY for placeable addresses. A city-only address
  // ("San Francisco, CA") would geocode to the city centroid and fake-pin the
  // event there, which is exactly the bug we're avoiding.
  if ((!row.location_lat || !row.location_lng) && isPlaceable(row.location_address)) {
    const geo = await geocode(row.location_address)
    if (geo) {
      row.location_lat = geo.lat
      row.location_lng = geo.lng
    }
    await sleep(1100) // Nominatim TOS rate limit
  }
  if (row.location_lat && row.location_lng && !inBayBbox(row.location_lat, row.location_lng)) {
    row.location_lat = null
    row.location_lng = null
  }

  // No fabricated coordinates: an event we can't place precisely is left
  // without a map pin (it still shows in the list) rather than dropped onto
  // a random spot near SF center, which misrepresents where it actually is.
  if (!row.location_lat || !row.location_lng) {
    counts[source].nolocation++
  }

  // POST — tries with emoji first; if the column doesn't exist on the
  // target schema (e.g. migration not yet applied) we retry without it.
  const baseBody = {
    title: row.title.slice(0, 255),
    description: row.description ?? null,
    category: row.category,
    location_address: row.location_address ?? null,
    location_lat: row.location_lat ?? null,
    location_lng: row.location_lng ?? null,
    available_from: row.available_from ?? null,
    available_until: row.available_until ?? null,
    status: 'available',
    url: row.url,
    posted_by: row.posted_by,
    edit_code: 'scraper-' + randHex(12),
  }
  const withEmoji = { ...baseBody, emoji: inferEmoji(row.title, row.description, row.category) }

  let res = await fetch(REST, {
    method: 'POST',
    headers: { ...HEADERS, Prefer: 'resolution=ignore-duplicates' },
    body: JSON.stringify(withEmoji),
  })
  if (!res.ok) {
    const txt = await res.clone().text().catch(() => '')
    if (/emoji.*column/i.test(txt) || /PGRST204/i.test(txt)) {
      // Column doesn't exist yet; retry without emoji so the run still completes.
      res = await fetch(REST, {
        method: 'POST',
        headers: { ...HEADERS, Prefer: 'resolution=ignore-duplicates' },
        body: JSON.stringify(baseBody),
      })
    }
  }
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

// Look up an Event's location AND date on its full page (Funcheap embeds
// schema.org Event JSON-LD per post — that's the authoritative source for
// when the event actually starts/ends, vs the RSS pubDate which is just
// when the post was published).
async function fetchEventDetails(url) {
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
    const toIso = (v) => {
      if (!v) return null
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? null : d.toISOString()
    }
    return {
      address: address || null,
      lat: loc.geo?.latitude  ? parseFloat(loc.geo.latitude)  : null,
      lng: loc.geo?.longitude ? parseFloat(loc.geo.longitude) : null,
      startDate: toIso(ev.startDate),
      endDate:   toIso(ev.endDate),
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
      const rawTitle = stripHtml(xmlExtractFirst(item, 'title'))
      const link     = stripHtml(xmlExtractFirst(item, 'link'))
      const desc     = stripHtml(xmlExtractFirst(item, 'content:encoded') || xmlExtractFirst(item, 'description')).slice(0, 240)
      if (!rawTitle || !link) continue

      // Fetch the per-event page to pull structured location + date data
      const ev = await fetchEventDetails(link)
      // Be polite to Funcheap
      await sleep(300)

      // Date precedence: ld+json startDate (most accurate), then the
      // "M/D/YY:" prefix in the title. We deliberately do NOT fall back to
      // the RSS pubDate — that's when the *post* went up, not when the
      // event happens. Undated events are skipped in tryInsert.
      const titleDate = parseTitleDate(rawTitle)
      const startDate = ev?.startDate ?? titleDate ?? null
      const endDate   = ev?.endDate ?? null

      await tryInsert('funcheap', {
        title: stripTitleDate(rawTitle), description: desc, url: link,
        category: 'Events', posted_by: 'funcheap',
        available_from:  startDate,
        available_until: endDate,
        location_address: ev?.address ?? null,
        location_lat:    ev?.lat ?? null,
        location_lng:    ev?.lng ?? null,
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

// ──────────────── 3) JSON-LD event-listing pages ────────────────
// Eventbrite, DoTheBay, and similar aggregators all embed schema.org Event
// blocks in their listing HTML, so one parser serves them all. `source` is
// both the counts key and the posted_by tag.
const isLdEvent = (c) =>
  c?.['@type'] === 'Event' || (Array.isArray(c?.['@type']) && c['@type'].includes('Event'))

const toIsoOrNull = (v) => {
  if (!v) return null
  const d = new Date(v)
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

async function scrapeLdJsonPage(source, pageUrl) {
  console.log(`--- ${source} ---`)
  try {
    const res = await fetch(pageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; sfrats-scraper/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const html = await res.text()

    // extractLdJson already flattens @graph for us.
    const events = extractLdJson(html).filter(c => isLdEvent(c) && c.url && c.name)
    counts[source].fetched = events.length

    for (const ev of events) {
      if (totalInserted >= PER_RUN_CAP || counts[source].inserted >= PER_SOURCE_CAP) break
      const loc = ev.location ?? {}
      const addr = loc.address ?? {}
      const address = [loc.name, addr.streetAddress, addr.addressLocality, addr.postalCode]
        .filter(Boolean).join(', ')
      await tryInsert(source, {
        title: stripHtml(ev.name).slice(0, 255),
        description: stripHtml(ev.description || '').slice(0, 240) || null,
        url: ev.url,
        category: 'Events',
        posted_by: source,
        available_from:  toIsoOrNull(ev.startDate),
        available_until: toIsoOrNull(ev.endDate),
        location_address: address || null,
        location_lat: addr.latitude  ? parseFloat(addr.latitude)  : (loc.geo?.latitude  ? parseFloat(loc.geo.latitude)  : null),
        location_lng: addr.longitude ? parseFloat(addr.longitude) : (loc.geo?.longitude ? parseFloat(loc.geo.longitude) : null),
      })
    }
  } catch (e) {
    console.error(`${source} error:`, e.message)
    counts[source].error++
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
  // Reddit r/sanfrancisco search for "free" is too noisy — most hits
  // are conversation posts, not events. Keeping the function around
  // in case we want to point it at a tighter query later.
  // await scrapeReddit()
  await scrapeLdJsonPage('eventbrite', 'https://www.eventbrite.com/d/ca--san-francisco/free--events/')
  await scrapeLdJsonPage('dothebay', 'https://dothebay.com/free')

  const summary =
    `=== SFRATS scrape summary ===\n` +
    Object.entries(counts).map(([s, c]) =>
      `${s.padEnd(11, ' ')} fetched=${c.fetched} inserted=${c.inserted} dup=${c.dup} nodate=${c.nodate} nolocation=${c.nolocation} error=${c.error}`
    ).join('\n') +
    `\ntotal inserts: ${totalInserted}\n` +
    `runtime: ${((Date.now() - t0) / 1000).toFixed(1)}s`

  console.log('\n' + summary)

  // Run summary is logged to stdout only. We intentionally do NOT write a
  // "__SCRAPER_RUN__" heartbeat row into `items` — nothing reads it, and it
  // pollutes the events table (and the app's event count) with non-events.

  process.exit(0)
})()
