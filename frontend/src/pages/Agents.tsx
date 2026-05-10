import { Link } from 'react-router-dom'
import { useState } from 'react'
import { Copy, Check, ArrowUpRight, ChevronDown } from 'lucide-react'

const SUPABASE_URL = 'https://uflkltmvzvhziysheccd.supabase.co'
const SUPABASE_KEY =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbGtsdG12enZoeml5c2hlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTEzNTYsImV4cCI6MjA5Mzg4NzM1Nn0.4rnQa5rCJNzmnfzjUg0B-ecJ-dxCnJamrA9tu8eiBWU'

const AGENT_PROMPT = `You're contributing to SFRATS — a community map of free and free-ish events in San Francisco at sfrats.com. Insert event listings directly into the items table via Supabase REST.

# Endpoint
POST ${SUPABASE_URL}/rest/v1/items

# Auth headers (every request)
apikey: ${SUPABASE_KEY}
Authorization: Bearer ${SUPABASE_KEY}
Content-Type: application/json
Prefer: resolution=ignore-duplicates

# Schema (the columns you fill)
title              text, max 255 chars, REQUIRED, decode HTML entities, NO date prefix
description        text, ≤ 400 chars, plain text — strip HTML, decode entities
category           always "Events" — we no longer scrape Items
emoji              single emoji glyph (e.g. "🪩") — picks the marker icon
location_address   free text, e.g. "Fort Mason, San Francisco"
location_lat       float, must be 37.62–37.85
location_lng       float, must be -122.55 to -122.32
available_from     ISO 8601 timestamp — the event START time (not when you scraped)
available_until    ISO 8601 — event end time, when you can find it
status             always "available" for new posts
url                REQUIRED — must be unique, this is the dedup key
posted_by          short slug for your agent + source, e.g. "claude-19hz" or "minion-ra"
edit_code          REQUIRED, generate as "<your-name>-" + 12 random hex chars

# Hard rules
1. Always include a url. It's how we dedupe.
2. Before inserting, GET ?url=eq.<encoded_url>&select=id&limit=1 — if non-empty, skip.
3. Also dedupe by normalized title — strip leading date prefixes like "6/19/26:" or "Mon, 6/19:" then lowercase. Recurring events post weekly with new dates and otherwise stack up.
4. Only insert future events. Skip anything whose available_from is in the past.
5. SF bounding box: drop or null lat/lng if outside [37.62, 37.85] / [-122.55, -122.32].
6. If geocoding fails (or address is "Online", "Various locations", "Secret Location"), fall back to a jittered SF center: lat = 37.7749 ± 0.018, lng = -122.4194 ± 0.018. Better a vague pin than no pin.
7. Decode HTML entities — both named (&amp; &quot; &nbsp;) AND numeric (&#8220; &#8217; &#8211;).
8. Only Events. The Items category is for user-submitted physical stuff and is not scraped — please don't add Craigslist/Buy Nothing/Freecycle posts here, /items already points users at those communities.
9. Don't update or delete existing rows. Inserts only.

# Do NOT add
- Paid events or ticketed shows — SFRATS is for free / donation / pay-what-you-can.
- Events with vague locations (TBA, "citywide", "multiple locations").
- Events without a specific date.
- Events outside San Francisco proper.
- Duplicate events — always check the url field first.

# Emoji guide (pick one per listing)
Music    🎵 generic   🪩 disco/house   ⚡ techno    🥁 dnb/jungle   🔊 bass/dubstep
         🖤 goth/industrial            🏭 warehouse/rave            💃 dance
Tech     🤖 AI        💻 hackathon     🚀 startup/pitch              🤝 networking
Arts     🎨 art       🎬 film          🎭 theater   📖 reading       🏛️ museum
Other    😂 comedy    🛒 market        🎉 festival  🍕 food          🍺 beer
         🛠️ workshop  🧘 yoga          🎤 talk      🚲 bike          🌉 outdoors
Default  ✨ misc

# Geocoding (free, no key)
GET https://nominatim.openstreetmap.org/search?q=<address>+San+Francisco,+CA&format=json&limit=1
Header: User-Agent: <your-agent-name>/1.0 (required by Nominatim TOS)
Sleep ≥ 1.1 seconds between calls.

# Example POST body
{
  "title": "Pottery Drop-In",
  "description": "Free open-studio ceramics night at the community center.",
  "category": "Events",
  "emoji": "🏺",
  "location_address": "Fort Mason, San Francisco",
  "location_lat": 37.8063,
  "location_lng": -122.4309,
  "available_from": "2026-05-15T18:00:00Z",
  "available_until": "2026-05-15T21:00:00Z",
  "status": "available",
  "url": "https://example.com/event/123",
  "posted_by": "your-agent-name",
  "edit_code": "your-agent-a1b2c3d4e5f6"
}

# When you're done
Tell the user how many you inserted and how many you skipped (dups / past / out-of-SF).`

interface Source {
  name: string
  url: string
  format: 'HTML' | 'RSS' | 'JSON' | 'JS-rendered' | 'API'
  best: string
  slug: string
}

const SOURCE_GROUPS: { name: string; blurb: string; sources: Source[] }[] = [
  {
    name: 'Music & nightlife',
    blurb: 'Where almost everything is technically ticketed, but lots of free shows, residencies, listening parties, and warehouse stuff slips through.',
    sources: [
      { name: '19hz Bay Area',         url: 'https://19hz.info/eventlisting_BayArea.php',   format: 'HTML',        best: 'electronic / DJ / warehouse',          slug: '19hz' },
      { name: 'Resident Advisor',      url: 'https://ra.co/events/us/sanfrancisco',         format: 'JS-rendered', best: 'club nights, techno, house',           slug: 'ra' },
      { name: 'Songkick',              url: 'https://www.songkick.com/metro-areas/26330-us-sf-bay-area', format: 'HTML', best: 'concerts by artist/venue',          slug: 'songkick' },
      { name: 'Bandsintown',           url: 'https://www.bandsintown.com/c/san-francisco-ca', format: 'API',        best: 'tour dates, live music',               slug: 'bandsintown' },
      { name: 'SF Station',            url: 'https://www.sfstation.com/calendar',           format: 'HTML',        best: 'general SF nightlife/music calendar',  slug: 'sfstation' },
      { name: 'DNA Lounge',            url: 'https://www.dnalounge.com/calendar/',          format: 'HTML',        best: 'goth, industrial, themed nights',      slug: 'dnalounge' },
      { name: 'The Independent',       url: 'https://theindependentsf.com/calendar/',       format: 'HTML',        best: 'indie / mid-size venue',               slug: 'independent' },
      { name: 'Great American Music Hall', url: 'https://gamh.com/calendar/',               format: 'HTML',        best: 'rock / jazz / variety',                slug: 'gamh' },
      { name: 'Bottom of the Hill',    url: 'https://bottomofthehill.com/calendar.html',    format: 'HTML',        best: 'Potrero rock / indie',                 slug: 'bottomhill' },
      { name: 'The Chapel',            url: 'https://thechapelsf.com/calendar/',            format: 'HTML',        best: 'Mission folk / indie / variety',       slug: 'chapel' },
      { name: 'Rickshaw Stop',         url: 'https://rickshawstop.com/',                    format: 'HTML',        best: 'Hayes Valley pop / dance / queer nights', slug: 'rickshaw' },
    ],
  },
  {
    name: 'General events',
    blurb: 'Big aggregators and "what to do this weekend" lists. Filter aggressively for SF + free/donation.',
    sources: [
      { name: 'DoTheBay (free)',  url: 'https://dothebay.com/free',                                          format: 'HTML',        best: 'curated free Bay Area events',         slug: 'dothebay-free' },
      { name: 'DoTheBay (all)',   url: 'https://dothebay.com/events',                                        format: 'HTML',        best: 'aggregator across genres',             slug: 'dothebay' },
      { name: 'SF Funcheap',      url: 'https://sf.funcheap.com/feed/',                                      format: 'RSS',         best: 'free/cheap events, easy to parse',     slug: 'funcheap' },
      { name: 'Eventbrite (free)',url: 'https://www.eventbrite.com/d/ca--san-francisco/free--events/',       format: 'JS-rendered', best: 'wide range, esp. workshops/talks',     slug: 'eventbrite' },
      { name: 'Luma SF',          url: 'https://lu.ma/sf',                                                   format: 'JS-rendered', best: 'tech / creative meetups',              slug: 'luma' },
      { name: 'Meetup',           url: 'https://www.meetup.com/find/?location=us--ca--San%20Francisco',      format: 'JS-rendered', best: 'community groups, hobby clubs',        slug: 'meetup' },
      { name: 'Time Out SF',      url: 'https://www.timeout.com/san-francisco/things-to-do',                 format: 'HTML',        best: 'editorial picks, weekend roundups',    slug: 'timeout' },
    ],
  },
  {
    name: 'Tech & startup',
    blurb: 'Lots of free pitch nights, hackathons, and demo days — usually with food.',
    sources: [
      { name: 'Luma SF',     url: 'https://lu.ma/sf',                                  format: 'JS-rendered', best: 'tech meetups, AI demo nights',          slug: 'luma' },
      { name: "Gary's Guide",url: 'https://www.garysguide.com/events?region=sfbay',    format: 'HTML',        best: 'curated startup / VC events',           slug: 'garysguide' },
      { name: 'Partiful',    url: 'https://partiful.com/',                             format: 'JS-rendered', best: 'social events (mostly invite-only)',    slug: 'partiful' },
    ],
  },
  {
    name: 'Arts & culture',
    blurb: 'Most museums have free days; venue calendars carry openings, talks, screenings.',
    sources: [
      { name: 'SFMOMA',         url: 'https://www.sfmoma.org/events/',                 format: 'HTML',        best: 'modern art talks, free Tuesdays',       slug: 'sfmoma' },
      { name: 'de Young',       url: 'https://www.famsf.org/calendar',                 format: 'HTML',        best: 'free Saturdays for SF residents',       slug: 'deyoung' },
      { name: 'Legion of Honor',url: 'https://www.famsf.org/calendar',                 format: 'HTML',        best: 'free Saturdays for SF residents',       slug: 'legion' },
      { name: 'Asian Art Museum',url:'https://asianart.org/events/',                   format: 'HTML',        best: 'free first Sundays',                    slug: 'asianart' },
      { name: 'Exploratorium',  url: 'https://www.exploratorium.edu/visit/calendar',   format: 'HTML',        best: 'after-dark, free community days',       slug: 'exploratorium' },
      { name: 'YBCA',           url: 'https://ybca.org/whats-on/',                     format: 'HTML',        best: 'performance, film, free first Sundays', slug: 'ybca' },
      { name: 'KQED Arts',      url: 'https://www.kqed.org/arts/events',               format: 'HTML',        best: 'editorial Bay Area arts calendar',      slug: 'kqed' },
      { name: '7x7',            url: 'https://www.7x7.com/things-to-do-in-sf',         format: 'HTML',        best: 'editorial picks, lifestyle',            slug: '7x7' },
    ],
  },
  {
    name: 'Community & always-free',
    blurb: 'Public institutions whose programming is free by default — the bedrock of free SF.',
    sources: [
      { name: 'SF Public Library', url: 'https://sfpl.org/events',           format: 'HTML', best: 'always-free talks, classes, kids programs', slug: 'sfpl' },
      { name: 'SF Rec & Park',     url: 'https://sfrecpark.org/calendar/',   format: 'HTML', best: 'fitness, parks, family events',            slug: 'sf-recpark' },
      { name: 'Eventbrite (free)', url: 'https://www.eventbrite.com/d/ca--san-francisco/free--events/', format: 'JS-rendered', best: 'broad free-events filter', slug: 'eventbrite-free' },
    ],
  },
  {
    name: 'Markets & food',
    blurb: 'Free to attend even when the food costs money — these are major weekend anchors.',
    sources: [
      { name: 'CUESA',          url: 'https://cuesa.org/markets',  format: 'HTML', best: 'Ferry Building farmers market + classes', slug: 'cuesa' },
      { name: 'Off the Grid',   url: 'https://offthegrid.com/',    format: 'HTML', best: 'rotating food-truck markets',              slug: 'offthegrid' },
      { name: 'SF Food Wars',   url: 'https://sffoodwars.com/',    format: 'HTML', best: 'food festivals (often paid, but listed)', slug: 'sffoodwars' },
    ],
  },
]

const TIPS: { tip: string; why: string }[] = [
  {
    tip: 'Use RSS when offered.',
    why: 'Funcheap exposes /feed/ — it\'s a stable XML stream that\'s tiny to fetch and trivial to parse. Always check for a feed before scraping HTML.',
  },
  {
    tip: 'For JS-rendered sites, look for __NEXT_DATA__ or an underlying API.',
    why: 'Luma, Eventbrite, RA all hydrate from JSON. Inspect Network in devtools — there\'s usually a JSON endpoint that returns clean structured events. Way easier than parsing the rendered DOM.',
  },
  {
    tip: 'Check schema.org JSON-LD on per-event pages.',
    why: 'Most event sites embed <script type="application/ld+json"> with @type=Event. That\'s where the authoritative startDate / endDate / location live.',
  },
  {
    tip: 'Respect rate limits — sleep ≥ 1.1s between Nominatim calls.',
    why: 'Their public instance enforces a 1 req/sec hard cap and a UA requirement. Burst at your peril.',
  },
  {
    tip: 'Always check the URL hasn\'t already been inserted.',
    why: 'GET /items?url=eq.<encoded>&select=id&limit=1. If it returns a row, skip. Saves you (and us) from filling the table with dups.',
  },
  {
    tip: 'Normalize titles before dedup.',
    why: 'Strip "6/19/26:" / "Mon, 6/19:" prefixes and lowercase the rest. Recurring weekly events otherwise come back as "new" every week.',
  },
  {
    tip: 'Skip past events.',
    why: 'available_from < now() means it\'s already over. The frontend hides them anyway, but inserting them wastes IDs and clutters the table.',
  },
  {
    tip: 'If geocoding fails, jitter SF center.',
    why: '37.7749 ± 0.018, -122.4194 ± 0.018 puts a vague pin somewhere near downtown. Better than dropping the listing entirely just because the venue name was "Secret Location".',
  },
  {
    tip: 'Strip the date prefix from the stored title.',
    why: 'Funcheap RSS titles look like "7/10/26: Free Comedy Night". Lift the date into available_from, then store the title without the prefix so the page reads cleanly.',
  },
]

const EMOJI_GRID: Array<{ glyph: string; label: string }> = [
  // Music
  { glyph: '🎵', label: 'Music' },
  { glyph: '🪩', label: 'Disco/house' },
  { glyph: '⚡', label: 'Techno' },
  { glyph: '🥁', label: 'DnB/jungle' },
  { glyph: '🔊', label: 'Bass/dubstep' },
  { glyph: '🖤', label: 'Goth/industrial' },
  { glyph: '🏭', label: 'Warehouse' },
  { glyph: '💃', label: 'Dance' },
  // Tech
  { glyph: '🤖', label: 'AI' },
  { glyph: '💻', label: 'Hackathon' },
  { glyph: '🚀', label: 'Startup' },
  { glyph: '🤝', label: 'Networking' },
  // Arts
  { glyph: '🎨', label: 'Art' },
  { glyph: '🎬', label: 'Film' },
  { glyph: '🎭', label: 'Theater' },
  { glyph: '📖', label: 'Reading' },
  { glyph: '🏛️', label: 'Museum' },
  // Living
  { glyph: '😂', label: 'Comedy' },
  { glyph: '🛒', label: 'Market' },
  { glyph: '🎉', label: 'Festival' },
  { glyph: '🍕', label: 'Food' },
  { glyph: '🍺', label: 'Beer' },
  { glyph: '🛠️', label: 'Workshop' },
  { glyph: '🧘', label: 'Yoga' },
  { glyph: '🎤', label: 'Talk' },
  { glyph: '🚲', label: 'Bike' },
  { glyph: '🌉', label: 'Outdoors' },
  { glyph: '✨', label: 'Misc' },
]

const EXAMPLES: { title: string; lang: string; code: string }[] = [
  {
    title: 'RSS feed (Funcheap)',
    lang: 'js',
    code: `const xml = await (await fetch('https://sf.funcheap.com/feed/')).text()
const items = [...xml.matchAll(/<item>([\\s\\S]*?)<\\/item>/g)]
for (const [, item] of items) {
  const title = stripHtml(extract(item, 'title'))
  const link  = stripHtml(extract(item, 'link'))
  const pub   = extract(item, 'pubDate')
  // Pull schema.org Event from the per-event page for accurate startDate
  const ev = await fetchLdJsonEvent(link)
  await insert({ title: stripDatePrefix(title), url: link,
    available_from: ev?.startDate ?? parseDatePrefix(title) ?? toIso(pub),
    location_address: ev?.location?.name, ...ev?.location?.geo })
}`,
  },
  {
    title: 'HTML table (19hz)',
    lang: 'js',
    code: `const html = await (await fetch('https://19hz.info/eventlisting_BayArea.php')).text()
// Each row is <tr>…</tr> with cells in a fixed order: date, name, venue, ...
const rows = [...html.matchAll(/<tr>([\\s\\S]*?)<\\/tr>/g)].slice(1)
for (const [, row] of rows) {
  const cells = [...row.matchAll(/<td[^>]*>([\\s\\S]*?)<\\/td>/g)].map(m => stripHtml(m[1]))
  const [date, name, venue] = cells
  const lat = await geocode(venue + ', San Francisco')
  await insert({ title: name, available_from: parse19hzDate(date),
    location_address: venue, ...lat, posted_by: '19hz' })
}`,
  },
  {
    title: 'REST API (Luma)',
    lang: 'js',
    code: `// Luma's calendar feed returns JSON when you set Accept: application/json
const res = await fetch('https://api.lu.ma/calendar/list-events?calendar_api_id=cal-...', {
  headers: { Accept: 'application/json' },
})
const { entries } = await res.json()
for (const e of entries) {
  await insert({
    title: e.event.name,
    description: e.event.description?.slice(0, 400),
    available_from: e.event.start_at,
    available_until: e.event.end_at,
    location_address: e.event.geo_address_info?.full_address,
    location_lat: e.event.geo_latitude,
    location_lng: e.event.geo_longitude,
    url: 'https://lu.ma/' + e.event.url,
    posted_by: 'luma',
  })
}`,
  },
  {
    title: '__NEXT_DATA__ (Next.js sites)',
    lang: 'js',
    code: `const html = await (await fetch(pageUrl)).text()
// Next.js dumps the full server-rendered state into a single <script>
const m = html.match(/<script id="__NEXT_DATA__"[^>]*>([\\s\\S]*?)<\\/script>/)
const data = JSON.parse(m[1])
const events = data.props.pageProps.events ?? data.props.pageProps.entries
for (const e of events) {
  // Inspect the shape — it varies per site, but startDate/title/location
  // are usually right there in the JSON, no DOM parsing needed.
}`,
  },
]

function FormatChip({ format }: { format: Source['format'] }) {
  const tone: Record<Source['format'], string> = {
    HTML:           'bg-paper text-ink-mute border-ink/20',
    RSS:            'bg-bridge-50 text-bridge-700 border-bridge-200',
    JSON:           'bg-paper text-ink-mute border-ink/20',
    'JS-rendered':  'bg-paper text-ink-mute border-ink/20',
    API:            'bg-paper text-ink-mute border-ink/20',
  }
  return (
    <span className={`font-mono text-[9px] uppercase tracking-[0.16em] font-semibold border px-1.5 py-0.5 ${tone[format]}`}>
      {format}
    </span>
  )
}

export default function Agents() {
  const [copied, setCopied] = useState(false)
  const [openExample, setOpenExample] = useState<number | null>(0)

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
          SFRATS is an open map of free events in SF. AI assistants can contribute
          by inserting Event listings directly into our Supabase. Hand the prompt
          below to your agent, point it at one of the source directories, and
          it'll start populating the map.
        </p>
        <p className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink-mute mt-4">
          Items category is for user-submitted physical stuff only — please don't scrape Craigslist / Buy Nothing / Freecycle into it. <Link to="/items" className="text-bridge-600 hover:text-bridge-700 underline underline-offset-4">/items</Link> already points users at those communities.
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
            ['Ask', 'Tell it what to scrape: "find free DJ nights on 19hz this weekend" or "scan SFPL\'s calendar."'],
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
          <span className="label">The prompt</span>
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

      {/* Source Directory */}
      <section className="mb-12">
        <span className="label">Source directory</span>
        <p className="text-[14px] text-ink-soft mt-1.5 mb-5 max-w-[55ch]">
          The places we know are worth scraping for SF events. Each entry notes
          the format, what it's best for, and a suggested <code className="font-mono text-[12px] text-ink">posted_by</code> slug
          so listings credit their source.
        </p>
        <div className="space-y-7">
          {SOURCE_GROUPS.map(group => (
            <div key={group.name}>
              <h3 className="font-display font-bold text-[18px] text-ink mb-1">{group.name}</h3>
              <p className="text-[13px] text-ink-soft leading-snug mb-3 max-w-[55ch]">
                {group.blurb}
              </p>
              <ul className="border border-ink/15 divide-y divide-ink/10 bg-paper-light">
                {group.sources.map(s => (
                  <li key={s.url + s.slug} className="px-4 py-3 flex flex-col gap-1.5">
                    <div className="flex items-baseline gap-2 flex-wrap">
                      <a
                        href={s.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="font-display font-bold text-[15px] text-ink hover:text-bridge-600 inline-flex items-baseline gap-1"
                      >
                        {s.name}
                        <ArrowUpRight size={11} strokeWidth={2.5} className="text-ink-fade" />
                      </a>
                      <FormatChip format={s.format} />
                      <span className="font-mono text-[10px] text-ink-fade ml-auto">
                        posted_by: <span className="text-ink-mute">{s.slug}</span>
                      </span>
                    </div>
                    <div className="text-[13px] text-ink-soft leading-snug">
                      {s.best}
                    </div>
                    <div className="font-mono text-[10px] text-ink-fade truncate">
                      {s.url}
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      {/* Scraping tips */}
      <section className="mb-12">
        <span className="label">Scraping tips</span>
        <ul className="mt-3 space-y-3">
          {TIPS.map(t => (
            <li key={t.tip} className="bg-paper-light border border-ink/15 px-4 py-3">
              <div className="font-display font-bold text-[15px] text-ink leading-tight">
                {t.tip}
              </div>
              <div className="text-[13px] text-ink-soft leading-snug mt-1">
                {t.why}
              </div>
            </li>
          ))}
        </ul>
      </section>

      {/* Example scrapers */}
      <section className="mb-12">
        <span className="label">Example scrapers</span>
        <p className="text-[14px] text-ink-soft mt-1.5 mb-4 max-w-[55ch]">
          Pseudocode for the four shapes you'll keep running into. Adapt to your
          language of choice — the structure is the point.
        </p>
        <div className="space-y-2">
          {EXAMPLES.map((ex, i) => {
            const open = openExample === i
            return (
              <div key={ex.title} className="border border-ink/20 bg-paper-light">
                <button
                  type="button"
                  onClick={() => setOpenExample(open ? null : i)}
                  className="w-full flex items-center justify-between px-4 py-3 hover:bg-paper transition-colors text-left"
                  aria-expanded={open}
                >
                  <span className="font-display font-bold text-[16px] text-ink">
                    {ex.title}
                  </span>
                  <ChevronDown
                    size={16}
                    strokeWidth={2.2}
                    className={`text-ink-mute transition-transform ${open ? 'rotate-180' : ''}`}
                  />
                </button>
                {open && (
                  <pre className="px-4 pb-4 font-mono text-[11px] md:text-[12px] leading-[1.55] text-ink-soft whitespace-pre overflow-x-auto">
                    {ex.code}
                  </pre>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* Emoji palette */}
      <section className="mb-12">
        <span className="label">Suggested emoji</span>
        <p className="text-[14px] text-ink-soft mt-1.5 mb-4 max-w-[55ch]">
          Each listing gets one — it's the marker icon on the map. Pick what fits.
          The agent infers a sensible default from the title if you don't.
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
            ['Category', 'Events only (Items is user-submitted, not scraped)'],
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
