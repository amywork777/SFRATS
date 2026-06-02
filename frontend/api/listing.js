// Serverless function that injects per-listing Open Graph meta tags
// into the SPA shell. vercel.json rewrites /listing/:id → /api/listing?id=:id
// so social-media crawlers see real event metadata. Browsers boot the
// React app exactly as before.
//
// The shell is fetched from the same deployment's static /index.html
// rather than read off disk — Vercel's lambda fs layout varies, but
// the static asset always lives at the public URL.

const SUPABASE_URL = 'https://uflkltmvzvhziysheccd.supabase.co'
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbGtsdG12enZoeml5c2hlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTEzNTYsImV4cCI6MjA5Mzg4NzM1Nn0.4rnQa5rCJNzmnfzjUg0B-ecJ-dxCnJamrA9tu8eiBWU'

const DEFAULT_IMAGE = 'https://sfrats.com/sfrats-logo.png'

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function truncate(s, n) {
  if (!s) return ''
  const trimmed = s.trim().replace(/\s+/g, ' ')
  return trimmed.length > n ? trimmed.slice(0, n - 1).trimEnd() + '…' : trimmed
}

// "Sat May 11 · 6:00pm" without pulling in date-fns.
function formatEventDate(iso) {
  try {
    const d = new Date(iso)
    if (Number.isNaN(d.getTime())) return ''
    const day  = d.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', timeZone: 'America/Los_Angeles' })
    const time = d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'America/Los_Angeles' }).toLowerCase().replace(/\s/g, '')
    return `${day} · ${time}`
  } catch {
    return ''
  }
}

function buildOgTags(item, canonicalUrl) {
  const isEvent = item.category === 'Events'
  const emoji = item.emoji || '📅'
  const title = `${emoji} ${item.title}`.trim()

  const parts = []
  if (isEvent && item.available_from) {
    const d = formatEventDate(item.available_from)
    if (d) parts.push(d)
  }
  if (item.location_address) {
    // Trim the ", CA / 94110 / USA" tail but keep the city (Bay-Area-wide).
    parts.push(item.location_address.replace(/,\s*CA\b(\s*\d{5})?.*$/i, '').replace(/,\s*USA\s*$/i, '').slice(0, 60))
  }
  const meta = parts.join(' · ')
  const body = item.description ? truncate(item.description, 200) : ''
  const description = truncate([meta, body].filter(Boolean).join(' — '), 240)
    || 'A free event in the Bay Area. Posted on SF Rats.'

  const image = (item.images && item.images[0]) || DEFAULT_IMAGE

  return `
    <meta name="description" content="${escapeAttr(description)}" />
    <meta property="og:type" content="${isEvent ? 'event' : 'website'}" />
    <meta property="og:site_name" content="SF Rats" />
    <meta property="og:title" content="${escapeAttr(title)}" />
    <meta property="og:description" content="${escapeAttr(description)}" />
    <meta property="og:url" content="${escapeAttr(canonicalUrl)}" />
    <meta property="og:image" content="${escapeAttr(image)}" />
    <meta name="twitter:card" content="summary_large_image" />
    <meta name="twitter:title" content="${escapeAttr(title)}" />
    <meta name="twitter:description" content="${escapeAttr(description)}" />
    <meta name="twitter:image" content="${escapeAttr(image)}" />
    <title>${escapeAttr(title)} · SF Rats</title>`.trim()
}

function stripDefaults(html) {
  return html
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<meta property="og:[^"]+"[^>]*>/g, '')
    .replace(/<meta name="twitter:[^"]+"[^>]*>/g, '')
}

async function fetchShell(host) {
  const url = `https://${host}/index.html`
  const r = await fetch(url, { headers: { 'cache-control': 'no-cache' } })
  if (!r.ok) throw new Error(`shell fetch failed: ${r.status}`)
  return r.text()
}

async function fetchListing(id) {
  if (!/^\d+$/.test(id)) return null
  try {
    const r = await fetch(
      `${SUPABASE_URL}/rest/v1/items?id=eq.${id}&select=id,title,description,category,emoji,location_address,available_from,available_until,images`,
      { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
    )
    if (!r.ok) return null
    const rows = await r.json()
    return rows[0] ?? null
  } catch {
    return null
  }
}

export default async function handler(req, res) {
  const id   = String(req.query?.id ?? '').trim()
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'sfrats.com'
  const canonical = `https://${host}/listing/${id}`

  try {
    const [shell, listing] = await Promise.all([fetchShell(host), fetchListing(id)])

    let html = shell
    if (listing) {
      html = stripDefaults(html).replace('</head>', `${buildOgTags(listing, canonical)}\n  </head>`)
    }

    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=900')
    res.status(200).send(html)
  } catch (err) {
    console.error('og listing handler failed', err)
    // Don't crash. Redirect into the SPA via the homepage with a hint
    // — the React router will pick up the actual /listing/:id path
    // once the user is back in the app.
    res.setHeader('Content-Type', 'text/html; charset=utf-8')
    res.status(200).send(`<!doctype html>
<html><head>
<meta http-equiv="refresh" content="0;url=/" />
<title>SF Rats</title>
</head><body>
<script>location.replace('/listing/${id}'.replace(/[^/a-z0-9-]/gi,''))</script>
</body></html>`)
  }
}
