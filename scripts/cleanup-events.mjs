// One-off: walk every row in the Events category and:
//   1. Parse "M/D/YY:" date prefixes from the title into available_from.
//   2. Strip the prefix from the stored title so it reads cleanly.
//   3. Delete rows whose event date has clearly passed (no point in
//      keeping stale "5/3/26: …" rows around).
//
// Idempotent — safe to re-run. Uses the env vars SUPABASE_URL +
// SUPABASE_ANON_KEY so it can run with the same creds as the scraper.

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

async function listEvents() {
  const url = `${REST}?select=id,title,available_from,available_until,posted_by&category=eq.Events&order=id.asc`
  const res = await fetch(url, { headers: HEADERS })
  if (!res.ok) throw new Error(`list failed: ${res.status}`)
  return res.json()
}

async function patch(id, payload) {
  const res = await fetch(`${REST}?id=eq.${id}`, {
    method: 'PATCH',
    headers: HEADERS,
    body: JSON.stringify(payload),
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
  let fixed = 0, deleted = 0, untouched = 0

  for (const r of rows) {
    const titleDate = parseTitleDate(r.title)
    const cleanTitle = stripTitleDate(r.title)

    // If the parsed event date is more than a day in the past, drop it —
    // these are stale "X/Y/26:" recurring posts that have already passed.
    if (titleDate && new Date(titleDate).getTime() + DAY_MS < now) {
      console.log(`  delete ${r.id}  (past: ${titleDate.slice(0,10)})  ${r.title.slice(0,70)}`)
      await del(r.id)
      deleted++
      continue
    }

    const payload = {}
    if (titleDate && r.available_from !== titleDate) payload.available_from = titleDate
    if (cleanTitle && cleanTitle !== r.title)        payload.title = cleanTitle

    if (Object.keys(payload).length === 0) {
      untouched++
      continue
    }

    console.log(`  patch  ${r.id}  ${Object.keys(payload).join(',')}  ${cleanTitle.slice(0,70)}`)
    await patch(r.id, payload)
    fixed++
  }

  console.log(`\nfixed=${fixed}  deleted=${deleted}  untouched=${untouched}  total=${rows.length}`)
}

run().catch(err => { console.error(err); process.exit(1) })
