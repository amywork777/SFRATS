// Serverless function that injects per-listing Open Graph meta tags
// into the SPA shell. vercel.json rewrites /listing/:id → /api/listing?id=:id
// so social-media crawlers see real event metadata instead of the
// site-wide default. Browsers boot the React app exactly as before.

import { readFile } from 'node:fs/promises'
import { join } from 'node:path'
import { format } from 'date-fns'

const SUPABASE_URL = 'https://uflkltmvzvhziysheccd.supabase.co'
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbGtsdG12enZoeml5c2hlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTEzNTYsImV4cCI6MjA5Mzg4NzM1Nn0.4rnQa5rCJNzmnfzjUg0B-ecJ-dxCnJamrA9tu8eiBWU'

const DEFAULT_IMAGE = 'https://sfrats.com/sfrats-logo.png'

// Cache the built shell across warm invocations — it doesn't change
// between requests, only between deploys.
let shellPromise = null

async function getShell() {
  if (!shellPromise) {
    shellPromise = readFile(join(process.cwd(), 'dist', 'index.html'), 'utf-8')
  }
  return shellPromise
}

function escapeAttr(s) {
  return String(s).replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
}

function truncate(s, n) {
  if (!s) return ''
  const trimmed = s.trim().replace(/\s+/g, ' ')
  return trimmed.length > n ? trimmed.slice(0, n - 1).trimEnd() + '…' : trimmed
}

function buildOgTags(item, canonicalUrl) {
  const isEvent = item.category === 'Events'
  const emoji = item.emoji || (isEvent ? '📅' : '📦')
  const title = `${emoji} ${item.title}`.trim()

  // Description: "Sat May 11 · 6:00pm · Fort Mason — <listing description>"
  const parts = []
  if (isEvent && item.available_from) {
    try {
      const d = new Date(item.available_from)
      parts.push(format(d, 'EEE MMM d · h:mma').toLowerCase())
    } catch {/* fallthrough */}
  }
  if (item.location_address) {
    parts.push(item.location_address.replace(/,\s*San Francisco.*$/i, '').slice(0, 60))
  }
  const meta = parts.join(' · ')
  const body = item.description ? truncate(item.description, 200) : ''
  const description = truncate([meta, body].filter(Boolean).join(' — '), 240)
    || 'A free event in San Francisco. Posted on SF Rats.'

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

// Strip the default tags + title so we can replace them cleanly.
function stripDefaults(html) {
  return html
    .replace(/<title>[^<]*<\/title>/, '')
    .replace(/<meta name="description"[^>]*>/g, '')
    .replace(/<meta property="og:[^"]+"[^>]*>/g, '')
    .replace(/<meta name="twitter:[^"]+"[^>]*>/g, '')
}

export default async function handler(req, res) {
  const id = String(req.query?.id ?? '').trim()
  const host = req.headers['x-forwarded-host'] || req.headers.host || 'sfrats.com'
  const canonical = `https://${host}/listing/${id}`

  let html = await getShell()
  let listing = null

  if (/^\d+$/.test(id)) {
    try {
      const r = await fetch(
        `${SUPABASE_URL}/rest/v1/items?id=eq.${id}&select=id,title,description,category,emoji,location_address,available_from,available_until,images`,
        { headers: { apikey: SUPABASE_KEY, Authorization: `Bearer ${SUPABASE_KEY}` } }
      )
      if (r.ok) {
        const rows = await r.json()
        listing = rows[0] ?? null
      }
    } catch (err) {
      // Not fatal — fall back to default tags.
      console.error('listing fetch failed', err)
    }
  }

  if (listing) {
    html = stripDefaults(html).replace('</head>', `${buildOgTags(listing, canonical)}\n  </head>`)
  }

  res.setHeader('Content-Type', 'text/html; charset=utf-8')
  // Short cache so updates surface quickly but bursts of crawler traffic
  // don't hit Supabase each time.
  res.setHeader('Cache-Control', 'public, max-age=60, s-maxage=300, stale-while-revalidate=900')
  res.status(200).send(html)
}
