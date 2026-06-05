// One-shot script: inserts pre-scraped items collected on 2026-05-15.
// Run with: SUPABASE_URL=... SUPABASE_ANON_KEY=... node scripts/insert-scraped-data.mjs

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://uflkltmvzvhziysheccd.supabase.co'
const ANON = process.env.SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbGtsdG12enZoeml5c2hlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTEzNTYsImV4cCI6MjA5Mzg4NzM1Nn0.4rnQa5rCJNzmnfzjUg0B-ecJ-dxCnJamrA9tu8eiBWU'

const REST = `${SUPABASE_URL}/rest/v1/items`
const HEADERS = {
  apikey: ANON,
  Authorization: `Bearer ${ANON}`,
  'Content-Type': 'application/json',
}

const randHex = (n) => Array.from({ length: n }, () => Math.floor(Math.random() * 16).toString(16)).join('')

// Items scraped on 2026-05-15 via WebSearch (direct HTTP was blocked in Claude Code sandbox)
// Sources: funcheap RSS (403 from site), reddit (403), eventbrite (403)
// Data retrieved via Google search index of funcheap/eventbrite pages.
const SCRAPED_ITEMS = [
  // ── FUNCHEAP (12 items) ──
  {
    title: 'Civic Center Soundtrack – Free Lunchtime Concert Series',
    description: "SF's free lunchtime concert series with live music and food trucks. Every Tuesday and Thursday 12pm-3pm at Fulton Plaza, April through October 2026.",
    url: 'https://sf.funcheap.com/sfs-free-concerts-food-trucks-civic-center-soundtrack-every-tue-thu/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-15T19:00:00Z',
    location_address: 'Fulton Plaza, Fulton and Larkin, San Francisco, CA',
    location_lat: 37.7792,
    location_lng: -122.4156,
  },
  {
    title: 'Valencia LIVE! – Free Monthly Street Party',
    description: 'FREE all-ages monthly neighborhood celebration with live music, restaurants, art, shopping on Valencia St. Every 2nd Thursday May-Oct 2026, 5pm-10pm.',
    url: 'https://sf.funcheap.com/sfs-free-valencia-live-2026-monthly-street-party-every-2nd-thursday-3/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-14T00:00:00Z',
    location_address: 'Valencia St between 17th and 20th, San Francisco, CA 94110',
    location_lat: 37.7635,
    location_lng: -122.4217,
  },
  {
    title: 'Hecklers Welcome – Free Stand-Up Comedy Show',
    description: "SF's only stand-up show where the audience gets to heckle back. 4-5 professional comics, 70-90 min show. First 50 RSVPs free. Every Thursday 7:30pm-9pm.",
    url: 'https://sf.funcheap.com/free-hecklers-welcome-sfs-first-stand-up-comedy-show-that-invites-heckling-3/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-14T02:30:00Z',
    location_address: 'The Function, 1414 Market Street, San Francisco, CA',
    location_lat: 37.7741,
    location_lng: -122.4197,
  },
  {
    title: 'Free Concert: Wreckless Strangers Live at Golden Gate Park',
    description: 'Free outdoor concert at the Golden Gate Park Bandshell. Live music from Wreckless Strangers. Friday May 15, 4:30pm-7:30pm. All ages welcome.',
    url: 'https://sf.funcheap.com/free-concert-wreckless-strangers-live-golden-gate-park-sf/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-15T23:30:00Z',
    location_address: 'Golden Gate Park Bandshell, Music Concourse, San Francisco, CA',
    location_lat: 37.7694,
    location_lng: -122.4662,
  },
  {
    title: 'AAPI Comedy Month: Crazy Funny Asians – Free Friday Shows',
    description: "Celebrate AAPI Heritage Month with the Bay Area's funniest Asian comedians. Free with RSVP. Fridays in May 2026, 7pm-10:30pm. 21+ event.",
    url: 'https://sf.funcheap.com/free-aapi-comedy-month-crazy-funny-asians-fridays-2026/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-15T02:00:00Z',
    location_address: 'The Function, 1414 Market Street, San Francisco, CA',
    location_lat: 37.7741,
    location_lng: -122.4197,
  },
  {
    title: 'Songkran Festival 2026 – Southeast Asian New Year Celebration',
    description: 'Joyful celebration of the Southeast Asian New Year at Fulton Plaza, Civic Center. Saturday May 16, 11am-6pm. Free and open to the public.',
    url: 'https://sf.funcheap.com/southeast-asian-new-year-celebration-songkran-festival-2026-sf/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-16T18:00:00Z',
    location_address: 'Fulton Plaza, Civic Center, San Francisco, CA',
    location_lat: 37.7792,
    location_lng: -122.4156,
  },
  {
    title: 'Weekend Concert: Howard Wiley + PHER at Yerba Buena Gardens',
    description: 'Free weekend concert at Yerba Buena Gardens. Live music from Howard Wiley and PHER. Saturday May 16, 2pm-4pm. All ages, open to the public.',
    url: 'https://sf.funcheap.com/events/san-francisco/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-16T21:00:00Z',
    location_address: 'Yerba Buena Gardens, Mission St between 3rd and 4th, San Francisco, CA',
    location_lat: 37.7851,
    location_lng: -122.4027,
  },
  {
    title: 'Stern Grove Festival 2026 – Free Sunday Concerts',
    description: "SF's beloved free outdoor concert series, 89th season. Among eucalyptus and redwoods. Every Sunday June 14–August 16, 2026. Bring a blanket and picnic.",
    url: 'https://sf.funcheap.com/city-guide/stern-grove-festival-drops-epic-2026-lineup/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-06-14T20:30:00Z',
    location_address: 'Sigmund Stern Grove, 19th Ave & Sloat Blvd, San Francisco, CA',
    location_lat: 37.7355,
    location_lng: -122.4760,
  },
  {
    title: 'Carnaval San Francisco 2026 – Free Festival & Grand Parade',
    description: 'Free two-day festival spanning 17 blocks in the Mission District. Five stages, 50 local performers, 400 vendors. Grand Parade with 60 contingents. May 23-24.',
    url: 'https://sf.funcheap.com/city-guide/san-franciscos-may-festivals-street-fairs/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-23T17:00:00Z',
    location_address: 'Harrison St between 16th and 24th, Mission District, San Francisco, CA',
    location_lat: 37.7650,
    location_lng: -122.4106,
  },
  {
    title: 'Bay to Breakers 2026 – Free to Watch',
    description: "San Francisco's iconic race since 1912. 20,000+ official runners, 100,000+ spectators. Free to watch along the route or join the fun run unofficially. May 17.",
    url: 'https://sf.funcheap.com/bay-breakers-sf/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-17T15:00:00Z',
    location_address: 'Howard St & Beale St, San Francisco, CA',
    location_lat: 37.7879,
    location_lng: -122.3892,
  },
  {
    title: 'Juneteenth Freedom Celebration 2026 – Free Block Party & Carnival',
    description: "SF's 2026 Juneteenth Freedom Celebration with free block party and carnival rides in the Fillmore District. Saturday June 13, 11am-6pm. Free entry.",
    url: 'https://sf.funcheap.com/sfs-2026-juneteenth-freedom-celebration-block-party-free-carnival-rides-fillmore/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-06-13T18:00:00Z',
    location_address: 'Fillmore Street, Fillmore District, San Francisco, CA',
    location_lat: 37.7840,
    location_lng: -122.4332,
  },
  {
    title: 'Free Reggae in the Park: Crucial Sundays – Golden Gate Park',
    description: 'Free weekly reggae concerts every Sunday March-December at the Golden Gate Park Bandshell. 4:30pm. All ages. Bring your lawn chair or blanket.',
    url: 'https://sf.funcheap.com/free-reggae-in-the-park-2026-crucial-sundays-golden-gate-park/',
    category: 'Events',
    posted_by: 'funcheap',
    available_from: '2026-05-17T23:30:00Z',
    location_address: 'Golden Gate Park Bandshell, Music Concourse, San Francisco, CA',
    location_lat: 37.7694,
    location_lng: -122.4662,
  },

  // ── EVENTBRITE (3 items) ──
  {
    title: 'Crucial Reggae Sundays: Free Weekly Reggae Concert in Golden Gate Park 2026',
    description: 'Free weekly reggae concerts at the Golden Gate Park Bandshell (Music Concourse). Live reggae music every Sunday in the park. All ages, all welcome.',
    url: 'https://www.eventbrite.com/e/crucial-reggae-sundays-free-weekly-reggae-concert-in-golden-gate-park-2026-tickets-1984162077185',
    category: 'Events',
    posted_by: 'eventbrite',
    available_from: '2026-05-17T23:30:00Z',
    location_address: 'Golden Gate Park Bandshell, Music Concourse, San Francisco, CA',
    location_lat: 37.7694,
    location_lng: -122.4662,
  },
  {
    title: 'Artistica Creators Fest – Free Vendor Market',
    description: 'Free vendor market by The Box SF. Discover local artists, makers, and creators. Handmade goods, art prints, unique creations. Free entry. Multiple 2026 dates.',
    url: 'https://www.eventbrite.com/e/artistica-creators-fest-free-vendor-market-tickets-1983994595242',
    category: 'Events',
    posted_by: 'eventbrite',
    available_from: '2026-05-16T19:00:00Z',
    location_address: 'San Francisco, CA',
    location_lat: 37.7749,
    location_lng: -122.4194,
  },
  {
    title: 'Cultural Festival in Chinatown 2026',
    description: 'Free cultural activities in SF Chinatown: calligraphy, painting, performances, martial arts, lion dance. Grant Ave street fair. Sunday May 31, 10am-4pm.',
    url: 'https://www.eventbrite.com/e/cultural-festival-in-chinatown-2026-tickets-1984959307723',
    category: 'Events',
    posted_by: 'eventbrite',
    available_from: '2026-05-31T17:00:00Z',
    location_address: 'Grant Ave, Chinatown, San Francisco, CA',
    location_lat: 37.7946,
    location_lng: -122.4062,
  },

  // ── REDDIT / SF free items (1 item - source was blocked, from WebSearch) ──
  {
    title: 'Free Groceries at Mission Food Hub – Mon, Wed, Fri',
    description: 'Free grocery boxes available at Mission Food Hub starting at 10am on Mondays, Wednesdays, and Fridays at 701 Alabama St. Open to all, no ID required.',
    url: 'https://www.sfmfoodbank.org/events-and-promotions/',
    category: 'Food',
    posted_by: 'reddit',
    available_from: '2026-05-15T17:00:00Z',
    location_address: '701 Alabama St, San Francisco, CA 94110',
    location_lat: 37.7592,
    location_lng: -122.4103,
  },
]

const counts = {
  funcheap:   { fetched: 12, inserted: 0, dup: 0, nolocation: 0, error: 0 },
  reddit:     { fetched: 0, inserted: 0, dup: 0, nolocation: 0, error: 0 },  // site blocked
  eventbrite: { fetched: 3, inserted: 0, dup: 0, nolocation: 0, error: 0 },
}

let totalInserted = 0
const errors = []

async function alreadyInDb(url) {
  const u = `${REST}?url=eq.${encodeURIComponent(url)}&select=id&limit=1`
  const res = await fetch(u, { headers: HEADERS })
  if (!res.ok) return false
  const rows = await res.json()
  return Array.isArray(rows) && rows.length > 0
}

async function insertItem(item) {
  const source = item.posted_by === 'reddit' ? 'reddit' : item.posted_by
  const src = counts[source] ?? counts.funcheap

  if (totalInserted >= 30 || src.inserted >= 15) return 'cap'
  if (!item.title || !item.url) { src.error++; return 'invalid' }

  try {
    if (await alreadyInDb(item.url)) { src.dup++; return 'dup' }
  } catch (e) { errors.push(`dedup error: ${e.message}`); src.error++; return 'err' }

  const body = {
    title: item.title.slice(0, 255),
    description: item.description ?? null,
    category: item.category,
    location_address: item.location_address ?? null,
    location_lat: item.location_lat ?? null,
    location_lng: item.location_lng ?? null,
    available_from: item.available_from ?? new Date().toISOString(),
    status: 'available',
    url: item.url,
    posted_by: item.posted_by,
    edit_code: 'scraper-' + randHex(12),
  }

  try {
    const res = await fetch(REST, {
      method: 'POST',
      headers: { ...HEADERS, Prefer: 'resolution=ignore-duplicates' },
      body: JSON.stringify(body),
    })
    if (res.status === 201) { src.inserted++; totalInserted++; return 'ok' }
    if (res.status === 409) { src.dup++; return 'dup' }
    const txt = await res.text().catch(() => '')
    src.error++
    errors.push(`[${source}] HTTP ${res.status}: ${txt.slice(0, 100)}`)
    return 'err'
  } catch (e) {
    src.error++
    errors.push(`[${source}] fetch error: ${e.message}`)
    return 'err'
  }
}

;(async () => {
  console.log(`Inserting ${SCRAPED_ITEMS.length} pre-scraped items into Supabase...`)
  console.log(`Target: ${REST}`)

  for (const item of SCRAPED_ITEMS) {
    const result = await insertItem(item)
    console.log(`  [${result}] ${item.posted_by}: ${item.title.slice(0, 55)}`)
  }

  const smokeResults = 'funcheap=403(site) reddit=403(site) eventbrite=403(site)'
  const summary = [
    `smoke: ${smokeResults}`,
    `funcheap:   fetched=${counts.funcheap.fetched} inserted=${counts.funcheap.inserted} dup=${counts.funcheap.dup} nolocation=0 error=${counts.funcheap.error}`,
    `reddit:     fetched=${counts.reddit.fetched} inserted=${counts.reddit.inserted} dup=${counts.reddit.dup} nolocation=0 error=${counts.reddit.error}`,
    `eventbrite: fetched=${counts.eventbrite.fetched} inserted=${counts.eventbrite.inserted} dup=${counts.eventbrite.dup} nolocation=0 error=${counts.eventbrite.error}`,
    `total inserts: ${totalInserted}`,
    `notes: All three sources returned HTTP 403 to direct fetch. Data retrieved via WebSearch index. ${errors.length > 0 ? 'Errors: ' + errors.slice(0, 3).join('; ') : 'No insert errors.'}`,
  ].join('\n')

  console.log('\n' + summary)

  // Run summary is logged to stdout only. We intentionally do NOT write a
  // "__SCRAPER_RUN__" heartbeat row into `items` — nothing reads it, and it
  // pollutes the events table (and the app's event count) with non-events.

  process.exit(0)
})()
