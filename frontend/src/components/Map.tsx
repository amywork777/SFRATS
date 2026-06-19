import { useEffect, useState, useCallback } from 'react'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { useNavigate } from 'react-router-dom'
import { createPortal } from 'react-dom'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { DbItem } from '../types/supabase'
import { api } from '../services/api'
import ListingPreview from './ListingPreview'
import { inferEmoji } from '../utils/categoryIcons'
import { isActive, withinRadius, MILE_KM } from '../utils/listingFilters'
import { eventType } from '../utils/eventTypes'
import TypeChips from './TypeChips'
import { DbItem as DbItemRow } from '../types/supabase'
import ListView from './ListView'
import { Map as MapIconLucide, List as ListIcon, ArrowRight } from 'lucide-react'
import { formatEventDate } from '../utils/dates'
import SubmissionsList from './SubmissionsList'
import SearchFilter from './SearchFilter'
import NearMeFilter from './NearMeFilter'
import DatePicker from './DatePicker'
import { presetToRange, rangeToPreset, dayToRange, rangeToDay, readUrlFilters, writeUrlFilters } from '../utils/urlFilters'

// Create custom marker icons for each category. When several events share a
// venue they collapse into one pin (see groupByVenue) — `count` renders a
// badge so people know there's more than one event behind it.
const createMarkerIcon = (
  item: Pick<DbItemRow, 'emoji' | 'title' | 'description' | 'category'>,
  count: number,
) => {
  const glyph = item.emoji || inferEmoji(item.title, item.description ?? null, item.category)
  const badge = count > 1 ? `<span class="marker-count">${count}</span>` : ''
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin"><span class="marker-emoji">${glyph}</span>${badge}</div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -22],
  })
}

// Events frequently share a venue, which geocodes to identical coordinates.
// Leaflet would stack those pins exactly on top of each other — that both
// piles their drop shadows into a dark blob and makes every event but the
// top one unclickable. Collapse co-located events into a single pin instead.
type Venue = { lat: number; lng: number; items: DbItem[] }

const groupByVenue = (items: DbItem[]): Venue[] => {
  // NB: a plain object, not a Map — the `Map` identifier is shadowed by this
  // file's own `Map` component, so `new Map()` wouldn't resolve to the builtin.
  const venues: Record<string, Venue> = {}
  for (const item of items) {
    if (item.location_lat == null || item.location_lng == null) continue
    // Round to ~1m so one address resolves to one pin.
    const key = `${item.location_lat.toFixed(5)},${item.location_lng.toFixed(5)}`
    const existing = venues[key]
    if (existing) existing.items.push(item)
    else venues[key] = { lat: item.location_lat, lng: item.location_lng, items: [item] }
  }
  return Object.values(venues)
}

// Popup body for a venue that hosts more than one event: a compact, scrollable
// list. Tapping a row opens that event's detail page.
function VenueListPopup({ items }: { items: DbItem[] }) {
  const address = items.find(i => i.location_address)?.location_address
  return (
    <div className="w-[260px]">
      <div className="mb-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-ink-mute">
          {items.length} events here
        </span>
        {address && (
          <h3 className="font-display font-bold text-[15px] leading-tight text-ink mt-0.5">
            {address}
          </h3>
        )}
      </div>
      <div className="rule-hair mb-2" />
      <div className="max-h-[280px] overflow-y-auto -mr-1 pr-1 space-y-1.5">
        {items.map(it => {
          const glyph = it.emoji || inferEmoji(it.title, it.description ?? null, it.category)
          return (
            <button
              key={it.id}
              onClick={() => { window.location.href = `/listing/${it.id}` }}
              className="w-full flex items-start gap-2 text-left p-2 border border-ink/20 bg-paper-light hover:bg-paper hover:border-ink/40 transition-colors"
            >
              <span className="inline-flex items-center justify-center w-7 h-7 text-[15px] bg-paper border border-ink/30 leading-none shrink-0">
                {glyph}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display font-bold text-[13px] leading-tight text-ink truncate">
                  {it.title}
                </span>
                <span className="block font-mono text-[10px] uppercase tracking-[0.08em] text-ink-mute mt-0.5">
                  {formatEventDate(it.available_from, 'MMM d · h:mm a')}
                </span>
              </span>
              <ArrowRight size={13} strokeWidth={2.5} className="text-ink-mute mt-1 shrink-0" />
            </button>
          )
        })}
      </div>
    </div>
  )
}

// When the user enables "Near me", pan + zoom the map so the radius
// circle fills the view. Otherwise the circle is drawn but might sit
// off-screen, which makes the feature feel broken on first use.
function FitToRadius({ location, radiusKm }: { location: { lat: number; lng: number }; radiusKm: number }) {
  const map = useMap()
  useEffect(() => {
    const center = L.latLng(location.lat, location.lng)
    const bounds = center.toBounds(radiusKm * 2 * 1000) // diameter in metres
    map.flyToBounds(bounds, { padding: [40, 40], duration: 0.6 })
  }, [location.lat, location.lng, radiusKm, map])
  return null
}

// Renders Leaflet markers (imperatively, since they live on the Leaflet map)
// and the currently-open popup (declaratively, via a portal that stays inside
// the React tree). Keeping the popup in the tree — instead of hand-managing
// createRoot/unmount — avoids the React 18 "unmount during render" race that
// used to leave empty popup cards stranded on the map.
function MarkerLayer({ items }: { items: DbItem[] }) {
  const map = useMap()
  const navigate = useNavigate()
  const [open, setOpen] = useState<{ key: number; venue: Venue } | null>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const isMobile = typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches

  // One marker per venue (co-located events collapse into a single pin).
  // Clicking a marker opens its popup; we only remove the markers we added.
  useEffect(() => {
    const markers: L.Marker[] = []
    groupByVenue(items).forEach(venue => {
      const key = venue.items[0].id
      const marker = L.marker([venue.lat, venue.lng], {
        icon: createMarkerIcon(venue.items[0], venue.items.length),
      })
      marker.on('click', () => setOpen({ key, venue }))
      marker.addTo(map)
      markers.push(marker)
    })
    return () => { markers.forEach(m => map.removeLayer(m)) }
  }, [items, map])

  // If the open venue drops out of the filtered set, close its popup.
  useEffect(() => {
    if (open && !groupByVenue(items).some(v => v.items[0].id === open.key)) {
      setOpen(null)
    }
  }, [items, open])

  // Desktop: glue the popup next to its marker as the map pans/zooms.
  // Mobile: CSS pins it to the bottom as a sheet, so no positioning needed.
  useEffect(() => {
    if (!open || isMobile) { setPos(null); return }
    const place = () => {
      const pt = map.latLngToContainerPoint(L.latLng(open.venue.lat, open.venue.lng))
      const r = map.getContainer().getBoundingClientRect()
      setPos({ left: r.left + pt.x + 20, top: r.top + pt.y - 20 })
    }
    place()
    map.on('move', place)
    map.on('zoom', place)
    return () => { map.off('move', place); map.off('zoom', place) }
  }, [open, isMobile, map])

  // Clicking empty map space closes the popup; clicking a marker does not.
  useEffect(() => {
    const onMapClick = (e: L.LeafletMouseEvent) => {
      if (!(e.originalEvent.target as Element)?.closest?.('.marker-pin')) setOpen(null)
    }
    map.on('click', onMapClick)
    return () => { map.off('click', onMapClick) }
  }, [map])

  if (!open) return null
  const { key, venue } = open
  const close = () => setOpen(null)

  return createPortal(
    <div
      id={`popup-${key}`}
      data-mobile={isMobile ? 'true' : undefined}
      // Render off-screen until positioned (desktop) so it never flashes at 0,0.
      style={isMobile ? undefined : { left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}
    >
      <div className="relative">
        <button
          onClick={close}
          aria-label="Close"
          className="absolute top-1 right-1 w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center text-ink-mute hover:text-ink hover:bg-paper-dark transition-colors"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
        {venue.items.length === 1 ? (
          <ListingPreview
            {...venue.items[0]}
            showDirections={true}
            inPopup={true}
            onViewDetails={() => { close(); navigate(`/listing/${venue.items[0].id}`) }}
          />
        ) : (
          <VenueListPopup items={venue.items} />
        )}
      </div>
    </div>,
    document.body,
  )
}

function Map() {
  const [items, setItems] = useState<DbItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Filter state initializes from the URL so links like
  // /?d=tonight&q=comedy bring you straight to a pre-filtered view.
  const [filters, setFilters] = useState<{
    search: string;
    dates: { start: Date | null; end: Date | null };
    userLocation: { lat: number; lng: number } | null;
    radiusMiles: number;
    types: string[];
  }>(() => {
    const initial = typeof window !== 'undefined' ? readUrlFilters(window.location.search) : { preset: null, day: null, search: '' }
    const dates = initial.day
      ? dayToRange(initial.day)
      : initial.preset ? presetToRange(initial.preset) : { start: null, end: null }
    return {
      search: initial.search,
      dates,
      userLocation: null,
      radiusMiles: 2,
      types: [],
    }
  })
  const [view, setView] = useState<'map' | 'list'>('map')

  // Keep the URL in sync with the filters that make sense to share —
  // selected day (or weekend preset) + search. Location / radius stay local.
  useEffect(() => {
    writeUrlFilters({
      day: rangeToDay(filters.dates),
      preset: rangeToPreset(filters.dates),
      search: filters.search,
    })
  }, [filters.dates, filters.search])

  const fetchItems = useCallback(async () => {
    try {
      console.log('Fetching items with filters:', filters)
      
      // Use the api service instead of direct fetch
      const data = await api.getItems()
      console.log('Received data:', data)

      // No need to process dates as they're already in the correct format
      setItems(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching items:', err)
      setError(err instanceof Error ? err.message : 'Failed to load items')
      setItems([])
    } finally {
      setLoading(false)
    }
  }, [filters])

  // Update useEffect to use fetchItems
  useEffect(() => {
    fetchItems()
  }, [fetchItems])

  const handleFiltersChange = (newFilters: any) => {
    setFilters(prev => ({
      ...prev,
      ...newFilters
    }))
  }

  const filteredItems = items.filter(item => {
    if (item.category !== 'Events') return false

    // Auto-expire: hide events past their end (or +24h after start).
    // See utils/listingFilters.ts for the rules.
    if (!isActive(item)) return false

    const eventDate = new Date(item.available_from)

    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    // Type filter (derived from emoji — see utils/eventTypes.ts).
    if (filters.types.length && !filters.types.includes(eventType(item))) return false
    if (filters.dates.start && eventDate.getTime() < filters.dates.start.getTime()) return false
    if (filters.dates.end   && eventDate.getTime() > filters.dates.end.getTime()) return false

    // Radius filter (distance from user-set location)
    if (filters.userLocation) {
      const radiusKm = filters.radiusMiles * MILE_KM
      if (!withinRadius(item, filters.userLocation.lat, filters.userLocation.lng, radiusKm)) {
        return false
      }
    }

    return true
  })

  return (
    <div className="fixed inset-0 top-14 md:top-16">
      {/* Full-width column: unified filter bar, then either Map or List */}
      <div className="relative h-full flex flex-col">
        {/* Unified filter bar: when / type / near-me / search on the left,
            view toggle on the right. Replaces the old sidebar + mobile sheet. */}
        <div className="relative z-[1200] bg-paper-light border-b border-ink/15 shrink-0">
          <div className="flex items-center justify-between gap-3 px-3 md:px-5 pt-2.5 pb-2.5">
          <div className="flex flex-wrap items-center gap-1.5 min-w-0">
            <DatePicker
              value={filters.dates}
              onChange={(dates) => handleFiltersChange({ dates })}
            />
            <TypeChips
              value={filters.types}
              onChange={(types) => handleFiltersChange({ types })}
            />
            <NearMeFilter
              location={filters.userLocation}
              radiusMiles={filters.radiusMiles}
              onChange={({ location, radiusMiles }) =>
                handleFiltersChange({ userLocation: location, radiusMiles })}
            />
            <SearchFilter
              value={filters.search}
              onChange={(search) => handleFiltersChange({ search })}
            />
          </div>
          <div className="flex items-center border border-ink/30 bg-paper shrink-0">
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 md:py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold transition-colors ${
                view === 'map' ? 'bg-ink text-paper-light' : 'text-ink-mute hover:text-ink'
              }`}
              aria-label="Map view"
            >
              <MapIconLucide size={14} strokeWidth={2.2} />
              <span className="hidden sm:inline">Map</span>
            </button>
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 md:py-1.5 font-mono text-[10px] uppercase tracking-[0.14em] font-semibold transition-colors ${
                view === 'list' ? 'bg-ink text-paper-light' : 'text-ink-mute hover:text-ink'
              }`}
              aria-label="List view"
            >
              <ListIcon size={14} strokeWidth={2.2} />
              <span className="hidden sm:inline">List</span>
            </button>
          </div>
          </div>
        </div>

        {/* The content swaps based on view */}
        {view === 'map' ? (
          <div className="relative flex-1 min-h-0">
            <MapContainer
              center={[37.7749, -122.4194]}
              zoom={13}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <TileLayer
                url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
                attribution='&copy; OpenStreetMap &copy; CARTO'
                subdomains="abcd"
                maxZoom={20}
                detectRetina={true}
              />
              <MarkerLayer items={filteredItems} />

              {/* User location + radius circle */}
              {filters.userLocation && (
                <>
                  <Circle
                    center={[filters.userLocation.lat, filters.userLocation.lng]}
                    radius={filters.radiusMiles * MILE_KM * 1000}
                    pathOptions={{
                      color: '#2563eb',
                      weight: 1.5,
                      fillColor: '#2563eb',
                      fillOpacity: 0.06,
                      opacity: 0.7,
                    }}
                  />
                  <Marker
                    position={[filters.userLocation.lat, filters.userLocation.lng]}
                    interactive={false}
                    icon={L.divIcon({
                      className: 'user-location-marker',
                      html: '<div class="pulse"></div>',
                      iconSize: [18, 18],
                      iconAnchor: [9, 9],
                    })}
                  />
                  <FitToRadius location={filters.userLocation} radiusKm={filters.radiusMiles * MILE_KM} />
                </>
              )}
            </MapContainer>

            {/* Counter stamp */}
            <div className="pointer-events-none absolute top-3 left-3 md:top-4 md:left-4 z-[1000]">
              <div className="bg-paper-light border border-ink px-2.5 py-1 md:px-3 md:py-1.5 shadow-stamp -rotate-2">
                <div className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-ink-mute leading-none">Active</div>
                <div className="font-display font-black text-[22px] md:text-[28px] leading-none text-ink mt-0.5 tabular-nums">
                  {String(filteredItems.length).padStart(3, '0')}
                </div>
                <div className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-ink-mute leading-none mt-0.5">events</div>
              </div>
            </div>

            {/* Status overlay */}
            {(loading || error || !filteredItems.length) && (
              <div className="pointer-events-none absolute top-3 md:top-4 left-1/2 -translate-x-1/2 z-[1000] max-w-[80%]">
                <div className="pointer-events-auto bg-paper-light border border-ink shadow-stamp px-3 py-1.5 md:px-4 md:py-2 rotate-[-1deg]">
                  {loading && <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-ink-mute">Loading…</span>}
                  {!loading && error && (
                    <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-bridge-700">Couldn't load: {error}</span>
                  )}
                  {!loading && !error && !filteredItems.length && (
                    <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-ink">No events posted yet — be the first.</span>
                  )}
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto bg-paper">
            <ListView items={filteredItems} loading={loading} error={error} />
          </div>
        )}
      </div>

      {/* Recent Submissions Panel — only relevant in map mode */}
      {view === 'map' && (
        <div className="hidden md:block">
          <SubmissionsList category="Events" />
        </div>
      )}
    </div>
  )
}

export default Map