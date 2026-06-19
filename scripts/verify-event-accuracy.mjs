// Re-verify dates + locations for existing scraped Events against their
// authoritative source page, and correct the DB row.
//
// Why this exists: earlier scraper runs (a) stamped `now` on events whose
// real date couldn't be parsed and (b) dropped un-geocodable events onto a
// RANDOM jittered point near SF center. Both are now fixed in scrape.mjs,
// but rows already in the table keep the bad values. This pass re-reads the
// schema.org Event JSON-LD on each event's source page and rewrites
// available_from / available_until / location_* with the accurate data.
//
// Safety:
//   - DRY_RUN defaults to ON. It logs every intended change and writes
//     nothing. Set DRY_RUN=0 (or false) to actually PATCH the DB.
//   - Only touches scraper-sourced rows (posted_by in funcheap/eventbrite).
//     Human-submitted listings are never modified.
//
// Env: SUPABASE_URL, SUPABASE_ANON_KEY, [DRY_RUN=1]
// Runs on Node 20 (GitHub Actions), where outbound network is available.

const SUPABASE_URL = process.env.SUPABASE_URL
const ANON = process.env.SUPABASE_ANON_KEY
if (!SUPABASE_URL || !ANON) {
  console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY')
  process.exit(1)
}
const DRY_RUN = !/^(0|false|no)$/i.test(process.env.DRY_RUN ?? '1')

const REST = `${SUPABASE_URL}/rest/v1/items`
const HEADERS = { apikey: ANON, Authorization: `Bearer ${ANON}`, 'Content-Type': 'application/json' }

// Bay Area bounding box (SFRATS is Bay-Area-wide, not SF-only). An SF-only box
// here would treat every legitimate Oakland / Berkeley / San Jose / Vallejo pin
// as out-of-area and clear it — corrupting correct data on every run.
const BAY_BBOX = { latMin: 37.1, latMax: 38.5, lngMin: -122.8, lngMax: -121.5 }
const SCRAPER_SOURCES = new Set(['funcheap', 'eventbrite', 'dothebay'])
const sleep = (ms) => new Promise(r => setTimeout(r, ms))
const inBayBbox = (lat, lng) =>
  lat >= BAY_BBOX.latMin && lat <= BAY_BBOX.latMax && lng >= BAY_BBOX.lngMin && lng <= BAY_BBOX.lngMax

// ── JSON-LD extraction (mirrors scrape.mjs) ──
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

async function fetchEventDetails(url) {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; sfrats-scraper/1.0)',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    if (!res.ok) return { ok: false, status: res.status }
    const html = await res.text()
    const ld = extractLdJson(html)
    const ev = ld.find((c) => c?.['@type'] === 'Event' || (Array.isArray(c?.['@type']) && c['@type'].includes('Event')))
    if (!ev) return { ok: true, found: false }
    const loc = ev.location ?? {}
    const addr = loc.address ?? {}
    const address = [loc.name, addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode]
      .filter(Boolean).join(', ') || (typeof loc === 'string' ? loc : null)
    const toIso = (v) => {
      if (!v) return null
      const d = new Date(v)
      return Number.isNaN(d.getTime()) ? null : d.toISOString()
    }
    return {
      ok: true,
      found: true,
      address: address || null,
      lat: loc.geo?.latitude  ? parseFloat(loc.geo.latitude)  : null,
      lng: loc.geo?.longitude ? parseFloat(loc.geo.longitude) : null,
      startDate: toIso(ev.startDate),
      endDate:   toIso(ev.endDate),
    }
  } catch (e) {
    return { ok: false, status: e.message }
  }
}

// ── Geocoding (mirrors scrape.mjs: SF-bounded, no double city) ──
async function geocode(address) {
  // Don't force "San Francisco" — Bay Area events can be anywhere in the box.
  const hasState = /,\s*ca\b|california/i.test(address)
  const q = hasState ? address : `${address}, CA`
  const viewbox = `${BAY_BBOX.lngMin},${BAY_BBOX.latMax},${BAY_BBOX.lngMax},${BAY_BBOX.latMin}`
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}`
    + `&format=json&limit=1&countrycodes=us&viewbox=${viewbox}&bounded=1`
  const res = await fetch(url, { headers: { 'User-Agent': 'sfrats-scraper/1.0' } })
  if (!res.ok) return null
  const data = await res.json()
  if (!data || data.length === 0) return null
  return { lat: parseFloat(data[0].lat), lng: parseFloat(data[0].lon) }
}

async function listScrapedEvents() {
  const url = `${REST}?select=id,title,available_from,available_until,location_address,location_lat,location_lng,posted_by,url`
    + `&category=eq.Events&order=id.asc&limit=10000`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`list failed: ${res.status}`)
  return res.json()
}

async function patch(id, payload) {
  const res = await fetch(`${REST}?id=eq.${id}`, {
    method: 'PATCH',
    headers: { ...HEADERS, Prefer: 'return=minimal' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`patch ${id} failed: ${res.status} ${await res.text()}`)
}

const approxEq = (a, b) => a != null && b != null && Math.abs(a - b) < 1e-5

async function run() {
  console.log(`mode: ${DRY_RUN ? 'DRY RUN (no writes)' : 'LIVE (will PATCH)'}`)
  const rows = await listScrapedEvents()
  const scoped = rows.filter(r => SCRAPER_SOURCES.has(r.posted_by) && r.url)
  console.log(`events total=${rows.length}  scraper-sourced=${scoped.length}`)

  const c = { checked: 0, dateFix: 0, locFix: 0, locCleared: 0, patched: 0, unreachable: 0, noEvent: 0, skipped: 0 }

  for (const r of scoped) {
    c.checked++
    const det = await fetchEventDetails(r.url)
    await sleep(300) // be polite to source sites
    if (!det.ok) { c.unreachable++; continue }
    if (!det.found) { c.noEvent++; continue }

    const payload = {}

    // --- DATE: trust the source's startDate/endDate over the stored value ---
    if (det.startDate && det.startDate !== r.available_from) {
      payload.available_from = det.startDate
      c.dateFix++
    }
    if (det.endDate && det.endDate !== r.available_until) {
      payload.available_until = det.endDate
    }

    // --- LOCATION: prefer source geo, else geocode the source address ---
    let lat = inBayBbox(det.lat, det.lng) ? det.lat : null
    let lng = inBayBbox(det.lat, det.lng) ? det.lng : null
    let address = det.address ?? r.location_address ?? null
    if ((lat == null || lng == null) && address) {
      const geo = await geocode(address)
      await sleep(1100) // Nominatim TOS rate limit
      if (geo && inBayBbox(geo.lat, geo.lng)) { lat = geo.lat; lng = geo.lng }
    }

    if (lat != null && lng != null) {
      if (!approxEq(lat, r.location_lat) || !approxEq(lng, r.location_lng)) {
        payload.location_lat = lat
        payload.location_lng = lng
        c.locFix++
      }
      if (address && address !== r.location_address) payload.location_address = address
    } else if (r.location_lat != null || r.location_lng != null) {
      // No trustworthy coordinates from the source → the stored ones were the
      // fabricated jittered pin. Clear them so the map stops lying; the row
      // still appears in the list view.
      payload.location_lat = null
      payload.location_lng = null
      c.locCleared++
    }

    if (Object.keys(payload).length === 0) { c.skipped++; continue }

    console.log(`#${r.id} ${DRY_RUN ? 'would patch' : 'patch'} ${Object.keys(payload).join(',')}  «${r.title.slice(0, 55)}»`)
    if (payload.available_from) console.log(`    date  ${r.available_from} -> ${payload.available_from}`)
    if ('location_lat' in payload) console.log(`    loc   [${r.location_lat},${r.location_lng}] -> [${payload.location_lat},${payload.location_lng}]`)

    if (!DRY_RUN) { await patch(r.id, payload); c.patched++ }
  }

  console.log(
    `\nchecked=${c.checked} dateFix=${c.dateFix} locFix=${c.locFix} locCleared=${c.locCleared} ` +
    `unreachable=${c.unreachable} noEvent=${c.noEvent} unchanged=${c.skipped} ` +
    `${DRY_RUN ? '(dry run — nothing written)' : `patched=${c.patched}`}`
  )
}

run().catch(err => { console.error(err); process.exit(1) })
