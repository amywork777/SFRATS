// One-off DB hygiene pass. Idempotent — re-run as often as you like.
//
// For every row in the Events category:
//   - Parse "M/D/YY:" date prefixes from the title into available_from.
//   - Strip the prefix from the stored title.
//   - Delete rows whose event date has clearly passed.
//   - Delete rows that obviously aren't free SF events:
//       · posted_by=reddit (the keyword search drags in conversation
//         posts that aren't events — quality is too low to keep).
//       · titles with a "$<price>" tail (paid events).
//       · titles that name a non-SF city (Oakland, San Jose, Berkeley).
//
// Uses SUPABASE_URL / SUPABASE_ANON_KEY, same as the scraper.

const SUPABASE_URL = process.env.SUPABASE_URL
const ANON = process.env.SUPABASE_ANON_KEY
if (!SUPABASE_URL || !ANON) {
  console.error('Missing SUPABASE_URL / SUPABASE_ANON_KEY')
  process.exit(1)
}

const REST = `${SUPABASE_URL}/rest/v1/items`
const HEADERS = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  'Content-Type': 'application/json',
  Prefer: 'return=minimal',
}

const TITLE_DATE_RE = /^\s*(?:[A-Za-z]{3,9},?\s+)?(\d{1,2})\/(\d{1,2})(?:\/(\d{2,4}))?\s*[:\-–—]?\s*/

function parseTitleDate(title = '', fallbackYear = new Date().getFullYear()) {
  const m = TITLE_DATE_RE.exec(title)
  if (!m) return null
  const month = parseInt(m[1], 10)
  const day   = parseInt(m[2], 10)
  let year    = m[3] ? parseInt(m[3], 10) : fallbackYear
  if (year < 100) year += 2000
  if (month < 1 || month > 12 || day < 1 || day > 31) return null
  const d = new Date(Date.UTC(year, month - 1, day, 19, 0, 0))
  return Number.isNaN(d.getTime()) ? null : d.toISOString()
}

const stripTitleDate = (t = '') => t.replace(TITLE_DATE_RE, '').trim()

// "Town Biz Comedy Night (Oakland)" → drop. Be loose with the match so
// "Oakland's …" and "in Oakland" both trip it.
const NON_SF_RE = /\b(oakland|berkeley|san\s*jose|emeryville|alameda|daly\s*city|south\s*san\s*francisco|palo\s*alto|mountain\s*view)\b/i

// Funcheap appends the price tail to titles: " - FREE" or " - $28.03".
// Keep "FREE" / "free"; drop anything else with a price marker.
function looksPaid(title = '') {
  const tail = title.match(/-\s*(\S[^-]*?)\s*$/)
  if (!tail) return false
  const t = tail[1].trim().toUpperCase()
  if (t === 'FREE') return false
  // "$X" / "$X.YY" / "$X-$Y"
  return /\$\d/.test(t)
}

async function listEvents() {
  const url = `${REST}?select=id,title,available_from,available_until,posted_by&category=eq.Events&order=id.asc&limit=10000`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`list failed: ${res.status}`)
  return res.json()
}

async function patch(id, payload) {
  const res = await fetch(`${REST}?id=eq.${id}`, {
    method: 'PATCH', headers: HEADERS, body: JSON.stringify(payload),
  })
  if (!res.ok) throw new Error(`patch ${id} failed: ${res.status} ${await res.text()}`)
}

async function del(id) {
  const res = await fetch(`${REST}?id=eq.${id}`, { method: 'DELETE', headers: HEADERS })
  if (!res.ok) throw new Error(`delete ${id} failed: ${res.status} ${await res.text()}`)
}

const DAY_MS = 24 * 60 * 60 * 1000

async function run() {
  const rows = await listEvents()
  const now = Date.now()
  const counters = { fixed: 0, deletedPast: 0, deletedReddit: 0, deletedPaid: 0, deletedNonSf: 0, untouched: 0 }

  for (const r of rows) {
    // 1. Reddit: too noisy, drop wholesale.
    if (r.posted_by === 'reddit') {
      console.log(`  drop reddit ${r.id}  ${r.title.slice(0,70)}`)
      await del(r.id); counters.deletedReddit++
      continue
    }

    // 2. Paid (price tail in title).
    if (looksPaid(r.title)) {
      console.log(`  drop paid   ${r.id}  ${r.title.slice(0,70)}`)
      await del(r.id); counters.deletedPaid++
      continue
    }

    // 3. Non-SF.
    if (NON_SF_RE.test(r.title)) {
      console.log(`  drop non-sf ${r.id}  ${r.title.slice(0,70)}`)
      await del(r.id); counters.deletedNonSf++
      continue
    }

    // 4. Past events (parsed from title prefix).
    const titleDate = parseTitleDate(r.title)
    if (titleDate && new Date(titleDate).getTime() + DAY_MS < now) {
      console.log(`  drop past   ${r.id}  (${titleDate.slice(0,10)})  ${r.title.slice(0,70)}`)
      await del(r.id); counters.deletedPast++
      continue
    }

    // 5. Patch date prefix + clean title.
    const cleanTitle = stripTitleDate(r.title)
    const payload = {}
    if (titleDate && r.available_from !== titleDate) payload.available_from = titleDate
    if (cleanTitle && cleanTitle !== r.title)        payload.title = cleanTitle

    if (Object.keys(payload).length === 0) { counters.untouched++; continue }
    console.log(`  patch       ${r.id}  ${Object.keys(payload).join(',')}  ${cleanTitle.slice(0,70)}`)
    await patch(r.id, payload); counters.fixed++
  }

  console.log(
    `\nfixed=${counters.fixed}  ` +
    `deleted(past=${counters.deletedPast} reddit=${counters.deletedReddit} ` +
    `paid=${counters.deletedPaid} nonSf=${counters.deletedNonSf})  ` +
    `untouched=${counters.untouched}  total=${rows.length}`
  )
}

run().catch(err => { console.error(err); process.exit(1) })
