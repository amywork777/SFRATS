#!/usr/bin/env python3
"""SFRATS one-shot scraper run."""
import json
import os
import re
import secrets
import time
import urllib.error
import urllib.parse
import urllib.request
from datetime import datetime, timezone
from html.parser import HTMLParser

SUPABASE_URL = "https://uflkltmvzvhziysheccd.supabase.co"
ANON_KEY = (
    "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"
    ".eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVmbGtsdG12enZoeml5c2hlY2NkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzgzMTEzNTYsImV4cCI6MjA5Mzg4NzM1Nn0"
    ".4rnQa5rCJNzmnfzjUg0B-ecJ-dxCnJamrA9tu8eiBWU"
)
ENDPOINT = f"{SUPABASE_URL}/rest/v1/items"

AUTH_HEADERS = {
    "apikey": ANON_KEY,
    "Authorization": f"Bearer {ANON_KEY}",
}

FUNCHEAP_URL = "https://sf.funcheap.com/feed/"
REDDIT_URL = "https://www.reddit.com/r/sanfrancisco/search.json?q=free&sort=new&restrict_sr=1&limit=25"
EVENTBRITE_URL = "https://www.eventbrite.com/d/ca--san-francisco/free--events/"

NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"

RUN_START = datetime.now(timezone.utc)

# ── helpers ────────────────────────────────────────────────────────────────────

class _TagStripper(HTMLParser):
    def __init__(self):
        super().__init__()
        self._parts = []
    def handle_data(self, data):
        self._parts.append(data)
    def get_text(self):
        return " ".join(self._parts)

def strip_html(html_str):
    if not html_str:
        return ""
    s = _TagStripper()
    try:
        s.feed(html_str)
    except Exception:
        pass
    return re.sub(r'\s+', ' ', s.get_text()).strip()

def http_get(url, headers=None, timeout=30):
    req = urllib.request.Request(url, headers=headers or {})
    try:
        with urllib.request.urlopen(req, timeout=timeout) as r:
            return r.status, r.read()
    except urllib.error.HTTPError as e:
        body = b""
        try:
            body = e.read()
        except Exception:
            pass
        return e.code, body
    except Exception as e:
        return 0, str(e).encode()

def smoke_test(url, ua):
    req = urllib.request.Request(url, headers={"User-Agent": ua})
    try:
        with urllib.request.urlopen(req, timeout=15) as r:
            return r.status
    except urllib.error.HTTPError as e:
        return e.code
    except Exception:
        return 0

def rand_edit_code():
    return "scraper-" + secrets.token_hex(6)

def now_iso():
    return datetime.now(timezone.utc).isoformat()

# ── Supabase helpers ───────────────────────────────────────────────────────────────

def check_dup(url_val):
    enc = urllib.parse.quote(url_val, safe="")
    check_url = f"{ENDPOINT}?url=eq.{enc}&select=id&limit=1"
    headers = {**AUTH_HEADERS}
    status, body = http_get(check_url, headers=headers)
    if status == 200:
        data = json.loads(body)
        return len(data) > 0
    return False

def insert_row(row):
    data = json.dumps(row).encode()
    req = urllib.request.Request(
        ENDPOINT,
        data=data,
        headers={
            **AUTH_HEADERS,
            "Content-Type": "application/json",
            "Prefer": "resolution=ignore-duplicates",
        },
        method="POST",
    )
    try:
        with urllib.request.urlopen(req, timeout=30) as r:
            return r.status, b""
    except urllib.error.HTTPError as e:
        body = b""
        try:
            body = e.read()
        except Exception:
            pass
        return e.code, body
    except Exception as e:
        return 0, str(e).encode()

# ── Geocoding ─────────────────────────────────────────────────────────────────────────

_last_nominatim = 0.0

def geocode(address):
    global _last_nominatim
    elapsed = time.time() - _last_nominatim
    if elapsed < 1.1:
        time.sleep(1.1 - elapsed)
    q = urllib.parse.quote(f"{address}, San Francisco, CA")
    url = f"{NOMINATIM_URL}?q={q}&format=json&limit=1"
    status, body = http_get(url, headers={"User-Agent": "sfrats-scraper/1.0"}, timeout=15)
    _last_nominatim = time.time()
    if status == 200:
        results = json.loads(body)
        if results:
            lat = float(results[0]["lat"])
            lng = float(results[0]["lon"])
            # SF bbox check
            if 37.62 <= lat <= 37.85 and -122.55 <= lng <= -122.32:
                return lat, lng
    return None, None

# ── Per-candidate pipeline ───────────────────────────────────────────────────────────

def process_candidates(candidates, stats, total_inserted, per_source_cap=15):
    inserted = 0
    for c in candidates:
        if total_inserted[0] >= 30:
            break
        if inserted >= per_source_cap:
            break
        title = (c.get("title") or "").strip()
        url_val = (c.get("url") or "").strip()
        if not title or not url_val:
            continue
        # dedup
        try:
            is_dup = check_dup(url_val)
        except Exception as e:
            stats["error"] += 1
            stats["notes"].append(f"dedup error: {e}")
            continue
        if is_dup:
            stats["dup"] += 1
            continue
        # geocode if address but no lat/lng
        lat = c.get("location_lat")
        lng = c.get("location_lng")
        address = c.get("location_address") or ""
        if address and (lat is None or lng is None):
            try:
                lat, lng = geocode(address)
            except Exception as e:
                stats["notes"].append(f"geocode error: {e}")
                lat, lng = None, None
        # SF bbox check
        if lat is not None and lng is not None:
            if not (37.62 <= lat <= 37.85 and -122.55 <= lng <= -122.32):
                lat, lng = None, None
        if lat is None or lng is None:
            stats["nolocation"] += 1

        row = {
            "title": title[:255],
            "description": (c.get("description") or "")[:2000],
            "category": c.get("category", "Items"),
            "location_address": address or None,
            "location_lat": lat,
            "location_lng": lng,
            "available_from": c.get("available_from") or now_iso(),
            "available_until": c.get("available_until"),
            "status": "available",
            "url": url_val,
            "posted_by": c.get("posted_by", "scraper"),
            "contact_info": c.get("contact_info"),
            "edit_code": rand_edit_code(),
            "images": c.get("images") or [],
        }
        # remove None values except explicit nulls we want
        row = {k: v for k, v in row.items() if v is not None or k in ("location_lat", "location_lng", "available_until", "contact_info")}

        status, body = insert_row(row)
        if status == 201:
            stats["inserted"] += 1
            inserted += 1
            total_inserted[0] += 1
        elif status == 409:
            stats["dup"] += 1
        else:
            stats["error"] += 1
            err_msg = body.decode(errors="replace")[:200]
            stats["notes"].append(f"insert HTTP {status}: {err_msg}")

    return inserted

# ── Source A: Funcheap RSS ───────────────────────────────────────────────────────────────

def fetch_funcheap():
    stats = {"fetched": 0, "inserted": 0, "dup": 0, "nolocation": 0, "error": 0, "notes": []}
    candidates = []
    try:
        status, body = http_get(FUNCHEAP_URL, headers={"User-Agent": "sfrats-scraper/1.0"}, timeout=30)
        if status not in (200, 301, 302):
            stats["notes"].append(f"HTTP {status}")
            return candidates, stats
        xml = body.decode("utf-8", errors="replace")
        items = re.findall(r'<item>(.*?)</item>', xml, re.DOTALL)
        for item_xml in items:
            title_m = re.search(r'<title>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</title>', item_xml, re.DOTALL)
            link_m = re.search(r'<link>(.*?)</link>', item_xml, re.DOTALL)
            pub_m = re.search(r'<pubDate>(.*?)</pubDate>', item_xml, re.DOTALL)
            desc_m = re.search(r'<content:encoded>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</content:encoded>', item_xml, re.DOTALL)
            if not desc_m:
                desc_m = re.search(r'<description>(?:<!\[CDATA\[)?(.*?)(?:\]\]>)?</description>', item_xml, re.DOTALL)
            title = strip_html(title_m.group(1).strip()) if title_m else ""
            link = link_m.group(1).strip() if link_m else ""
            pub_date = pub_m.group(1).strip() if pub_m else now_iso()
            desc_raw = desc_m.group(1).strip() if desc_m else ""
            desc = strip_html(desc_raw)[:240]
            if not title or not link:
                continue
            # parse pub_date
            try:
                from email.utils import parsedate_to_datetime
                avail_from = parsedate_to_datetime(pub_date).isoformat()
            except Exception:
                avail_from = now_iso()
            candidates.append({
                "title": title,
                "url": link,
                "description": desc,
                "category": "Events",
                "posted_by": "funcheap",
                "available_from": avail_from,
            })
        stats["fetched"] = len(candidates)
    except Exception as e:
        stats["notes"].append(f"fetch error: {e}")
    return candidates, stats

# ── Source B: Reddit r/sanfrancisco ─────────────────────────────────────────────────────

REDDIT_FILTER_WORDS = ["looking for", "asking", "iso ", "wanted", "in search of", "where can i find"]

def guess_category(text):
    t = text.lower()
    if any(w in t for w in ["pizza", "food", "sandwich", "coffee", "snack"]):
        return "Food"
    if any(w in t for w in ["concert", "event", "show", "festival", "meetup"]):
        return "Events"
    if any(w in t for w in ["repair", "help", "tutor", "lesson"]):
        return "Services"
    return "Items"

def fetch_reddit():
    stats = {"fetched": 0, "inserted": 0, "dup": 0, "nolocation": 0, "error": 0, "notes": []}
    candidates = []
    try:
        status, body = http_get(
            REDDIT_URL,
            headers={"User-Agent": "sfrats-scraper/1.0"},
            timeout=30,
        )
        if status not in (200,):
            stats["notes"].append(f"HTTP {status}")
            return candidates, stats
        data = json.loads(body)
        posts = data.get("data", {}).get("children", [])
        for post in posts:
            d = post.get("data", {})
            title = (d.get("title") or "").strip()
            selftext = (d.get("selftext") or "")[:400]
            permalink = d.get("permalink", "")
            created_utc = d.get("created_utc")
            # filter
            combined_lower = (title + " " + selftext).lower()
            if any(fw in title.lower() for fw in REDDIT_FILTER_WORDS):
                continue
            url_val = f"https://reddit.com{permalink}"
            avail_from = (
                datetime.fromtimestamp(created_utc, tz=timezone.utc).isoformat()
                if created_utc else now_iso()
            )
            candidates.append({
                "title": title,
                "url": url_val,
                "description": selftext,
                "category": guess_category(combined_lower),
                "posted_by": "reddit",
                "available_from": avail_from,
            })
        stats["fetched"] = len(candidates)
    except Exception as e:
        stats["notes"].append(f"fetch error: {e}")
    return candidates, stats

# ── Source C: Eventbrite ─────────────────────────────────────────────────────────────────────

def fetch_eventbrite():
    stats = {"fetched": 0, "inserted": 0, "dup": 0, "nolocation": 0, "error": 0, "notes": []}
    candidates = []
    try:
        status, body = http_get(
            EVENTBRITE_URL,
            headers={"User-Agent": "Mozilla/5.0 (compatible; sfrats-scraper/1.0)"},
            timeout=30,
        )
        if status not in (200,):
            stats["notes"].append(f"HTTP {status}")
            return candidates, stats
        html = body.decode("utf-8", errors="replace")
        # find all ld+json script blocks
        ld_blocks = re.findall(r'<script[^>]+type=["\']application/ld\+json["\'][^>]*>(.*?)</script>', html, re.DOTALL | re.IGNORECASE)
        if not ld_blocks:
            stats["notes"].append("no ld+json blocks found")
            return candidates, stats
        events = []
        for block in ld_blocks:
            try:
                obj = json.loads(block.strip())
            except Exception:
                continue
            if isinstance(obj, list):
                for item in obj:
                    if isinstance(item, dict) and item.get("@type") == "Event":
                        events.append(item)
            elif isinstance(obj, dict):
                if obj.get("@type") == "Event":
                    events.append(obj)
                # ItemList or similar wrapper
                items_list = obj.get("itemListElement") or obj.get("items") or []
                for item in items_list:
                    if isinstance(item, dict) and item.get("@type") == "Event":
                        events.append(item)
        if not events:
            stats["notes"].append("ld+json found but no Event entries")
            return candidates, stats
        for ev in events:
            title = (ev.get("name") or "").strip()
            url_val = (ev.get("url") or "").strip()
            start_date = ev.get("startDate") or now_iso()
            loc = ev.get("location") or {}
            loc_name = (loc.get("name") or "").strip()
            addr = loc.get("address") or {}
            if isinstance(addr, dict):
                street = addr.get("streetAddress", "")
                city = addr.get("addressLocality", "San Francisco")
                loc_address = f"{loc_name}, {street}".strip(", ") if street else loc_name
            else:
                loc_address = loc_name
            if not title or not url_val:
                continue
            candidates.append({
                "title": title,
                "url": url_val,
                "description": "",
                "category": "Events",
                "posted_by": "eventbrite",
                "available_from": start_date,
                "location_address": loc_address or None,
            })
        stats["fetched"] = len(candidates)
    except Exception as e:
        stats["notes"].append(f"fetch error: {e}")
    return candidates, stats

# ── Main ─────────────────────────────────────────────────────────────────────────────────

def main():
    print("=== SFRATS SCRAPER RUN ===")
    print(f"Start: {RUN_START.isoformat()}")

    # STEP 0 – smoke tests
    print("\n-- Smoke tests --")
    smoke_funcheap = smoke_test(FUNCHEAP_URL, "sfrats-scraper/1.0")
    print(f"  funcheap:   {smoke_funcheap}")
    smoke_reddit = smoke_test(REDDIT_URL, "sfrats-scraper/1.0")
    print(f"  reddit:     {smoke_reddit}")
    smoke_eventbrite = smoke_test(EVENTBRITE_URL, "Mozilla/5.0 (compatible; sfrats-scraper/1.0)")
    print(f"  eventbrite: {smoke_eventbrite}")

    total_inserted = [0]  # mutable counter

    # Source A
    print("\n-- Funcheap --")
    fc_candidates, fc_stats = fetch_funcheap()
    print(f"  fetched {fc_stats['fetched']} candidates")
    if fc_candidates:
        process_candidates(fc_candidates, fc_stats, total_inserted, per_source_cap=15)
    print(f"  inserted={fc_stats['inserted']} dup={fc_stats['dup']} nolocation={fc_stats['nolocation']} error={fc_stats['error']}")

    # Source B
    print("\n-- Reddit --")
    rd_candidates, rd_stats = fetch_reddit()
    print(f"  fetched {rd_stats['fetched']} candidates")
    if rd_candidates:
        process_candidates(rd_candidates, rd_stats, total_inserted, per_source_cap=15)
    print(f"  inserted={rd_stats['inserted']} dup={rd_stats['dup']} nolocation={rd_stats['nolocation']} error={rd_stats['error']}")

    # Source C
    print("\n-- Eventbrite --")
    eb_candidates, eb_stats = fetch_eventbrite()
    print(f"  fetched {eb_stats['fetched']} candidates")
    if eb_candidates:
        process_candidates(eb_candidates, eb_stats, total_inserted, per_source_cap=15)
    print(f"  inserted={eb_stats['inserted']} dup={eb_stats['dup']} nolocation={eb_stats['nolocation']} error={eb_stats['error']}")

    # ── Summary row ──────────────────────────────────────────────────────────────────
    print("\n-- Writing summary row --")
    iso_now = now_iso()
    all_notes = []
    for src, s in [("funcheap", fc_stats), ("reddit", rd_stats), ("eventbrite", eb_stats)]:
        if s["notes"]:
            all_notes.append(f"{src}: {'; '.join(s['notes'][:2])}")

    description = (
        f"smoke: funcheap={smoke_funcheap} reddit={smoke_reddit} eventbrite={smoke_eventbrite}\n"
        f"funcheap:   fetched={fc_stats['fetched']} inserted={fc_stats['inserted']} dup={fc_stats['dup']} nolocation={fc_stats['nolocation']} error={fc_stats['error']}\n"
        f"reddit:     fetched={rd_stats['fetched']} inserted={rd_stats['inserted']} dup={rd_stats['dup']} nolocation={rd_stats['nolocation']} error={rd_stats['error']}\n"
        f"eventbrite: fetched={eb_stats['fetched']} inserted={eb_stats['inserted']} dup={eb_stats['dup']} nolocation={eb_stats['nolocation']} error={eb_stats['error']}\n"
        f"total inserts: {total_inserted[0]}\n"
        f"notes: {'; '.join(all_notes) if all_notes else 'none'}"
    )

    summary_row = {
        "title": f"__SCRAPER_RUN__ {iso_now}",
        "description": description,
        "category": "Services",
        "status": "available",
        "posted_by": "scraper-meta",
        "edit_code": "scraper-meta",
        "location_lat": None,
        "location_lng": None,
        "url": None,
    }

    status, body = insert_row(summary_row)
    if status == 201:
        print("  Summary row inserted OK.")
    else:
        print(f"  Summary row failed (HTTP {status}), retrying...")
        time.sleep(2)
        status, body = insert_row(summary_row)
        if status == 201:
            print("  Summary row inserted OK (retry).")
        else:
            print(f"  Summary row FAILED: {body.decode(errors='replace')}")

    print(f"\n=== DONE: {total_inserted[0]} items inserted ===")
    print(description)

if __name__ == "__main__":
    main()
