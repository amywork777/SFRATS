// Re-place events that were fake-pinned (default-center / "San Francisco, CA"
// centroid) by recovering their real venue from the source page + title, then
// geocoding against a Bay-Area bounding box.
//
//   node scripts/fix-locations.mjs        # dry run — prints proposed changes
//   APPLY=1 node scripts/fix-locations.mjs  # writes updates to Supabase
//
const URL = process.env.SUPABASE_URL || "https://uflkltmvzvhziysheccd.supabase.co";
const KEY = process.env.SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbGtsdG12enZoeml5c2hlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTEzNTYsImV4cCI6MjA5Mzg4NzM1Nn0.4rnQa5rCJNzmnfzjUg0B-ecJ-dxCnJamrA9tu8eiBWU";
const H = { apikey: KEY, Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" };
const APPLY = !!process.env.APPLY;

// Bay Area bounding box (covers SF, East Bay, North Bay, Peninsula, South Bay)
const BAY = { latMin: 37.1, latMax: 38.5, lngMin: -122.8, lngMax: -121.5 };
const inBay = (lat, lng) => lat >= BAY.latMin && lat <= BAY.latMax && lng >= BAY.lngMin && lng <= BAY.lngMax;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

const NAMED = { amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " " };
const decode = (s = "") => s.replace(/&(#x?[0-9a-f]+|[a-z]+);/gi, (m, c) =>
  c[0] === "#" ? String.fromCodePoint(c[1] === "x" || c[1] === "X" ? parseInt(c.slice(2), 16) : parseInt(c.slice(1), 10)) : (NAMED[c.toLowerCase()] ?? m));
const stripHtml = (s = "") => decode(s).replace(/<[^>]*>/g, "").replace(/\s+/g, " ").trim();

function extractLdJson(html) {
  const out = [];
  const re = /<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g;
  let m;
  while ((m = re.exec(html)) !== null) {
    try {
      const j = JSON.parse(m[1]);
      for (const c of Array.isArray(j) ? j : [j]) {
        out.push(c);
        if (c?.["@graph"]) for (const g of c["@graph"]) out.push(g);
      }
    } catch { /* skip */ }
  }
  return out;
}

// Pull a real venue/address (and geo if present) from the event's source page.
async function fetchVenue(url) {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (compatible; sfrats-scraper/1.0)", "Accept-Language": "en-US,en;q=0.9" },
      redirect: "follow",
    });
    if (!res.ok) return null;
    const html = await res.text();
    const ev = extractLdJson(html).find((c) => c?.["@type"] === "Event" || (Array.isArray(c?.["@type"]) && c["@type"].includes("Event")));
    if (!ev) return null;
    const loc = ev.location ?? {};
    const addr = loc.address ?? {};
    const parts = [loc.name, addr.streetAddress, addr.addressLocality, addr.addressRegion, addr.postalCode].filter(Boolean);
    return {
      address: parts.join(", ") || (typeof loc === "string" ? loc : null),
      lat: loc.geo?.latitude ? parseFloat(loc.geo.latitude) : null,
      lng: loc.geo?.longitude ? parseFloat(loc.geo.longitude) : null,
    };
  } catch { return null; }
}

// Known Bay Area localities (cities + SF neighborhoods). We look for these in
// the funcheap URL slug and the title to disambiguate a bare venue name like
// "Monroe" (which is a North Beach SF bar, not the town of Monroe up north).
const SF_HOODS = ["north-beach", "union-square", "castro", "fillmore", "bayview", "chinatown", "japantown", "the-mission", "mission", "richmond", "sunset", "soma", "haight", "tenderloin", "potrero", "dogpatch", "marina", "nob-hill", "noe-valley", "hayes-valley", "golden-gate-park", "crissy-field", "presidio", "embarcadero"];
const CITIES = ["san-francisco", "oakland", "west-oakland", "berkeley", "san-jose", "redwood-city", "pleasant-hill", "orinda", "pittsburg", "piedmont", "vallejo", "mare-island", "castro-valley", "alameda", "richmond-ca", "daly-city", "palo-alto", "santa-rosa", "san-mateo"];
const deslug = (s) => s.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

// Derive a "City, CA" locality hint + whether it's inside SF proper.
function localityHint(url = "", title = "") {
  const hay = (url + " " + title).toLowerCase().replace(/[\s_]+/g, "-");
  for (const c of CITIES) if (hay.includes(c)) {
    const name = c === "mare-island" ? "Vallejo" : c === "richmond-ca" ? "Richmond" : deslug(c);
    return { locality: `${name}, CA`, isSf: c === "san-francisco" };
  }
  for (const h of SF_HOODS) if (hay.includes(h)) return { locality: `${deslug(h)}, San Francisco, CA`, isSf: true };
  return { locality: "San Francisco, CA", isSf: true }; // default — most events are SF
}

// High-confidence landmark / venue / neighborhood phrases. First match wins;
// the value is a geocodable query. Lets us place events whose page JSON-LD had
// no structured location but whose title clearly names a well-known place.
const LANDMARKS = [
  [/golden gate park/i, "Golden Gate Park, San Francisco, CA"],
  [/crissy field/i, "Crissy Field, San Francisco, CA"],
  [/(ocean beach|sunset dunes|great highway)/i, "Ocean Beach, San Francisco, CA"],
  [/yerba buena/i, "Yerba Buena Gardens, San Francisco, CA"],
  [/(sfo|airport)/i, "San Francisco International Airport, CA"],
  [/cobb'?s/i, "Cobb's Comedy Club, San Francisco, CA"],
  [/equinox/i, "Equinox Sports Club, San Francisco, CA"],
  [/african american art (and|&) culture/i, "762 Fulton Street, San Francisco, CA"],
  [/oakland first fridays/i, "Telegraph Avenue, Oakland, CA"],
  [/downtown sf|downtown san francisco/i, "Union Square, San Francisco, CA"],
  [/\bthe richmond\b/i, "Richmond District, San Francisco, CA"],
  [/\bnorth beach\b/i, "North Beach, San Francisco, CA"],
  [/\bfillmore\b/i, "Fillmore Street, San Francisco, CA"],
  [/\bcastro\b/i, "Castro District, San Francisco, CA"],
  [/\bpiedmont\b/i, "Piedmont, CA"],
];

// Venue guess from the title: parenthetical "(Madrone Art Bar)", "at Rye",
// a leading proper-noun place, or a known landmark/neighborhood phrase.
function venueFromTitle(title = "") {
  const paren = title.match(/\(([^)]{3,60})\)/);
  if (paren) {
    const v = paren[1].replace(/\b(july|aug|sept?|june|may|free|sf|all\s+good)\b.*$/i, "").trim();
    // Ignore date/season parentheticals like "(Summer 2026)" or "(July 4-5)"
    // so the landmark check below still gets a shot at a real place name.
    const dateLike = /^(summer|winter|spring|fall|autumn)\b/i.test(v) || /\b(19|20)\d{2}\b/.test(v) || /^\d/.test(v);
    if (v.length >= 3 && !dateLike) return v;
  }
  const at = title.match(/\bat\s+([A-Z][\w'’&.\- ]{2,40}?)(?:\s*[\-–—(]|$)/);
  if (at) return at[1].trim();
  for (const [re, q] of LANDMARKS) if (re.test(title)) return q;
  return null;
}

// True when the venue is intentionally undisclosed — don't fabricate a pin.
const isSecret = (title = "") => /\b(hellasecret|secret guest list|secret location)\b/i.test(title);

// Geocode within a box; SF-scoped when the locality is inside the city so an
// ambiguous name can't escape to a same-named place elsewhere in the Bay.
async function geocode(query, sfOnly = false) {
  const box = sfOnly
    ? { latMin: 37.70, latMax: 37.83, lngMin: -122.52, lngMax: -122.35 }
    : BAY;
  const vb = `${box.lngMin},${box.latMax},${box.lngMax},${box.latMin}`;
  const u = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(query)}&format=json&limit=1&countrycodes=us&viewbox=${vb}&bounded=1`;
  const r = await fetch(u, { headers: { "User-Agent": "sfrats-scraper/1.0" } });
  if (!r.ok) return null;
  const d = await r.json();
  if (!d.length) return null;
  const lat = +d[0].lat, lng = +d[0].lon;
  return inBay(lat, lng) ? { lat, lng, display: d[0].display_name } : null;
}

const near = (r, la, ln) => r.location_lat && Math.abs(r.location_lat - la) < 0.0008 && Math.abs(r.location_lng - ln) < 0.0008;
const hasStreet = (a) => a && /\d{2,}\s+\w|\b(st|street|ave|avenue|blvd|boulevard|rd|road|dr|drive|way|plaza|pier|park|gardens?|hall|center|centre)\b/i.test(a);
const isCityOnly = (a) => !a || /^\s*(san\s*francisco|sf|bay\s*area)\s*,?\s*(ca|california)?\s*$/i.test(a.trim());

async function main() {
  const res = await fetch(`${URL}/rest/v1/items?select=id,title,url,location_address,location_lat,location_lng&order=id.desc&limit=500`, { headers: H });
  const rows = await res.json();

  const atDefault = (r) => near(r, 37.7749, -122.4194);
  const atCentroid = (r) => near(r, 37.7765, -122.3948);
  const isIllinois = (r) => /illinois|lombard/i.test(r.location_address || "");
  const isOnline = (r) => /\b(online|virtual|zoom)\b/i.test(r.location_address || "") || /\bonline\b/i.test(r.title || "");

  // A: real address at default-center -> re-geocode the address
  const groupA = rows.filter((r) => atDefault(r) && hasStreet(r.location_address) && !isIllinois(r) && !isOnline(r));
  // B: "San Francisco, CA"-only centroid pins -> recover venue from page/title
  const groupB = rows.filter((r) => atCentroid(r) && isCityOnly(r.location_address) && !isOnline(r));
  // C: de-pin events that have no real physical location / wrong region
  const groupDepin = rows.filter((r) => (atDefault(r) || atCentroid(r)) && (isIllinois(r) || isOnline(r)));

  const proposals = [];

  for (const r of groupDepin) {
    proposals.push({ r, action: "DEPIN", reason: isIllinois(r) ? "address is in Illinois, not the Bay Area" : "online/virtual event — no physical pin" });
  }

  for (const r of groupA) {
    const hint = localityHint(r.url, r.title);
    const g = await geocode(r.location_address, hint.isSf);
    await sleep(1100);
    proposals.push(g
      ? { r, action: "MOVE", lat: g.lat, lng: g.lng, via: `addr:${r.location_address}` }
      : { r, action: "SKIP", reason: "geocode failed", via: r.location_address });
  }

  for (const r of groupB) {
    const hint = localityHint(r.url, r.title);
    let lat = null, lng = null, via = null, address = null;
    const v = await fetchVenue(r.url);
    await sleep(350);
    if (v?.lat && v?.lng && inBay(v.lat, v.lng)) { lat = v.lat; lng = v.lng; via = `page-geo: ${v.address}`; address = v.address; }
    else if (v?.address) {
      // If the page only gave a bare venue name (no city), append the hint.
      const q = /,/.test(v.address) ? v.address : `${v.address}, ${hint.locality}`;
      const g = await geocode(q, hint.isSf); await sleep(1100);
      if (g) { lat = g.lat; lng = g.lng; via = `page-addr: ${q}`; address = v.address; }
    }
    if (lat == null && !isSecret(r.title)) {
      const tv = venueFromTitle(r.title);
      if (tv) {
        // LANDMARK entries already include their own city; bare venues get the hint.
        const q = /,/.test(tv) ? tv : `${tv}, ${hint.locality}`;
        const sf = /san francisco/i.test(q) || (!/,\s*(oakland|berkeley|piedmont|vallejo|san jose|redwood)/i.test(q) && hint.isSf);
        const g = await geocode(q, sf); await sleep(1100);
        if (g) { lat = g.lat; lng = g.lng; via = `title-venue: ${q}`; }
      }
    }
    const reason = isSecret(r.title) ? "secret/undisclosed venue — left unpinned" : "no venue found on page or title";
    proposals.push(lat != null
      ? { r, action: "MOVE", lat, lng, via, address }
      : { r, action: "SKIP", reason, via: r.url });
  }

  // Report
  const byAction = (a) => proposals.filter((p) => p.action === a);
  console.log(`\n=== PROPOSALS (${proposals.length}) ===`);
  for (const p of proposals) {
    if (p.action === "MOVE") console.log(`MOVE  #${p.r.id} -> ${p.lat.toFixed(5)},${p.lng.toFixed(5)}  [${p.via}]  | ${p.r.title.slice(0, 50)}`);
    if (p.action === "DEPIN") console.log(`DEPIN #${p.r.id} (${p.reason}) | ${p.r.title.slice(0, 50)}`);
    if (p.action === "SKIP") console.log(`SKIP  #${p.r.id} (${p.reason}) | ${p.r.title.slice(0, 50)}`);
  }
  console.log(`\nMOVE=${byAction("MOVE").length}  DEPIN=${byAction("DEPIN").length}  SKIP=${byAction("SKIP").length}`);

  if (!APPLY) { console.log("\n(dry run — set APPLY=1 to write)"); return; }

  console.log("\n=== APPLYING ===");
  let ok = 0, fail = 0;
  for (const p of proposals) {
    if (p.action === "SKIP") continue;
    const body = p.action === "DEPIN"
      ? { location_lat: null, location_lng: null }
      : { location_lat: p.lat, location_lng: p.lng, ...(p.address ? { location_address: p.address } : {}) };
    const u = `${URL}/rest/v1/items?id=eq.${p.r.id}`;
    const r = await fetch(u, { method: "PATCH", headers: { ...H, Prefer: "return=minimal" }, body: JSON.stringify(body) });
    if (r.ok) ok++; else { fail++; console.error(`  FAIL #${p.r.id}: ${r.status} ${await r.text().catch(() => "")}`); }
  }
  console.log(`applied: ${ok} ok, ${fail} failed`);
}

main();
