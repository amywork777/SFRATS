import { useEffect, useState, useCallback, useRef, useMemo } from 'react'
import { MapContainer, Marker, useMap, Circle } from 'react-leaflet'
import { createPortal } from 'react-dom'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { DbItem } from '../types/supabase'
import { api } from '../services/api'
import { displayItem } from '../utils/displayText'
import QuietBasemap from './QuietBasemap'
import { EventIcon, markerGlyph, eventEmoji } from './EventIcon'
import { visibleEvents, withinRadius, MILE_KM } from '../utils/listingFilters'
import { eventType } from '../utils/eventTypes'
import TypeChips from './TypeChips'
import { DbItem as DbItemRow } from '../types/supabase'
import ListView from './ListView'
import SubmissionsList from './SubmissionsList'
import { Map as MapIconLucide, List as ListIcon, X } from 'lucide-react'
import { formatEventDate } from '../utils/dates'
import { formatEventWhen, stripTimeTba } from '../utils/timeTba'
import SearchFilter from './SearchFilter'
import NearMeFilter from './NearMeFilter'
import DatePicker from './DatePicker'
import { presetToRange, rangeToPreset, dayToRange, rangeToDay, rangeFromKeys, rangeToDays, readUrlFilters, writeUrlFilters } from '../utils/urlFilters'

// Pins always show an event, never an aggregate count.
const createMarkerIcon = (item: Pick<DbItemRow, 'emoji' | 'title' | 'description' | 'category'>) => L.divIcon({
  className: 'custom-marker',
  html: `<div class="marker-pin" data-type="${eventType(item)}"><span class="marker-symbol">${markerGlyph(eventType(item), eventEmoji(item))}</span></div>`,
  iconSize: [44, 44],
  iconAnchor: [22, 22],
})

// Shared coordinates retain their real location. The preview exposes each
// event by name instead of stacking unreachable pins or moving locations.
type Venue = { lat: number; lng: number; items: DbItem[] }

const groupByVenue = (items: DbItem[]): Venue[] => {
  // NB: a plain object, not a Map - the `Map` identifier is shadowed by this
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

// When the user enables "Near me", pan + zoom the map so the radius
// circle fills the view. Otherwise the circle is drawn but might sit
// off-screen, which makes the feature feel broken on first use.
function FitToRadius({ location, radiusKm }: { location: { lat: number; lng: number }; radiusKm: number }) {
  const map = useMap()
  useEffect(() => {
    const center = L.latLng(location.lat, location.lng)
    const bounds = center.toBounds(radiusKm * 2 * 1000) // diameter in metres
    map.flyToBounds(bounds, { padding: [40, 40], duration: window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 0.6 })
  }, [location.lat, location.lng, radiusKm, map])
  return null
}

function MarkerLayer({ items, selectedId, highlightedId, onSelect, onHighlight }: {
  items: DbItem[]
  selectedId: number | null
  highlightedId: number | null
  onSelect: (id: number | null) => void
  onHighlight: (id: number | null) => void
}) {
  const map = useMap()
  const venues = useMemo(() => groupByVenue(items), [items])
  const markerRefs = useRef<{ venue: Venue; marker: L.Marker }[]>([])
  const popupRef = useRef<HTMLDivElement>(null)
  const [pos, setPos] = useState<{ left: number; top: number } | null>(null)
  const [isMobile, setIsMobile] = useState(() => window.matchMedia('(max-width: 767px)').matches)
  const selected = items.find(item => item.id === selectedId)
  const venue = venues.find(v => v.items.some(item => item.id === selectedId))

  useEffect(() => {
    const query = window.matchMedia('(max-width: 767px)')
    const update = () => setIsMobile(query.matches)
    query.addEventListener('change', update)
    return () => query.removeEventListener('change', update)
  }, [])

  useEffect(() => {
    const layer = L.layerGroup().addTo(map)
    markerRefs.current = venues.map(venue => {
      const event = venue.items[0]
      const marker = L.marker([venue.lat, venue.lng], {
        icon: createMarkerIcon(event), title: event.title, alt: event.title,
        bubblingMouseEvents: false,
      }).addTo(layer)
      marker.on('click', () => onSelect(event.id))
      marker.on('mouseover', () => onHighlight(event.id))
      marker.on('mouseout', () => onHighlight(null))
      const tooltip = document.createElement('span')
      tooltip.textContent = event.title
      marker.bindTooltip(tooltip, { direction: 'top', offset: [0, -20], className: 'event-tooltip' })
      return { venue, marker }
    })
    const connectors = L.layerGroup().addTo(map)
    const arrange = () => {
      connectors.clearLayers()
      const occupied: L.Point[] = []
      markerRefs.current.forEach(({ venue, marker }) => {
        const origin = map.latLngToLayerPoint([venue.lat, venue.lng])
        let point = origin
        // Keep nearby emoji targets separately clickable. A leader line keeps
        // displaced pins connected to their real coordinates; no fake venues.
        for (let step = 0; occupied.some(p => p.distanceTo(point) < 46); step++) {
          const radius = 46 * (1 + Math.floor(step / 12))
          const angle = (step % 12) * Math.PI / 6
          point = origin.add(L.point(Math.cos(angle) * radius, Math.sin(angle) * radius))
        }
        occupied.push(point)
        const position = map.layerPointToLatLng(point)
        marker.setLatLng(position)
        if (!point.equals(origin)) {
          L.polyline([[venue.lat, venue.lng], position], { color: '#687469', weight: 1, opacity: 0.65, interactive: false }).addTo(connectors)
        }
      })
    }
    arrange()
    map.on('zoomend', arrange)
    return () => { map.off('zoomend', arrange); connectors.remove(); layer.remove(); markerRefs.current = [] }
  }, [venues, map, onSelect, onHighlight])

  useEffect(() => {
    markerRefs.current.forEach(({ venue, marker }) => {
      const selected = venue.items.find(item => item.id === selectedId)
      const event = selected || venue.items[0]
      marker.setIcon(createMarkerIcon(event))
      const el = marker.getElement()
      el?.classList.toggle('is-selected', !!selected)
      el?.setAttribute('aria-pressed', String(!!selected))
      el?.setAttribute('aria-label', event.title)
      el?.setAttribute('title', event.title)
      const tooltip = document.createElement('span')
      tooltip.textContent = event.title
      marker.setTooltipContent(tooltip)
      marker.off('click').on('click', () => onSelect(event.id))
      marker.setZIndexOffset(selected ? 2000 : 0)
    })
  }, [selectedId, venues, onSelect])

  useEffect(() => {
    markerRefs.current.forEach(({ venue, marker }) => {
      const highlighted = venue.items.some(item => item.id === highlightedId)
      marker.getElement()?.classList.toggle('is-highlighted', highlighted)
      marker.setZIndexOffset(venue.items.some(item => item.id === selectedId) ? 2000 : highlighted ? 1000 : 0)
    })
  }, [highlightedId, selectedId, venues])

  useEffect(() => {
    if (venue) map.panInside([venue.lat, venue.lng], { padding: [70, 70], animate: !window.matchMedia('(prefers-reduced-motion: reduce)').matches })
  }, [venue, map])

  useEffect(() => {
    if (!venue || isMobile) { setPos(null); return }
    const place = () => {
      const pin = markerRefs.current.find(entry => entry.venue === venue)?.marker
      const pt = map.latLngToContainerPoint(pin?.getLatLng() || [venue.lat, venue.lng])
      const r = map.getContainer().getBoundingClientRect()
      const popup = popupRef.current
      const width = popup?.offsetWidth || 320
      const height = popup?.offsetHeight || 380
      const right = r.left + pt.x + 26
      const left = right + width <= r.right - 12 ? right : r.left + pt.x - width - 26
      setPos({ left: Math.max(r.left + 12, Math.min(left, r.right - width - 12)), top: Math.max(r.top + 12, Math.min(r.top + pt.y - 30, r.bottom - height - 12)) })
    }
    place()
    const observer = new ResizeObserver(place)
    if (popupRef.current) observer.observe(popupRef.current)
    map.on('move zoom zoomend resize', place)
    return () => { map.off('move zoom zoomend resize', place); observer.disconnect() }
  }, [venue, isMobile, map])

  useEffect(() => {
    const close = () => onSelect(null)
    const escape = (e: KeyboardEvent) => { if (e.key === 'Escape') close() }
    map.on('click', close)
    window.addEventListener('keydown', escape)
    return () => { map.off('click', close); window.removeEventListener('keydown', escape) }
  }, [map, onSelect])

  if (!selected || !venue) return null
  const others = venue.items.filter(item => item.id !== selected.id)
  return createPortal(
    <div ref={popupRef} id={`popup-${selected.id}`} className="event-map-preview" role="region" aria-label="Selected event"
      data-mobile={isMobile ? 'true' : undefined}
      style={isMobile ? undefined : { left: pos?.left ?? -9999, top: pos?.top ?? -9999 }}>
      <button className="event-preview-close" onClick={() => onSelect(null)} aria-label="Close event preview"><X size={18} /></button>
      <div className="event-preview-title"><EventIcon type={eventType(selected)} emoji={eventEmoji(selected)} size={26} /><h3>{selected.title}</h3></div>
      <p className="event-preview-time">{formatEventWhen(selected.available_from, selected.description)}</p>
      {selected.location_address && <p className="event-preview-place">{selected.location_address}</p>}
      {stripTimeTba(selected.description) && <p className="event-preview-description">{stripTimeTba(selected.description)}</p>}
      <a className="event-preview-open" href={`/listing/${selected.id}`}>View event</a>
      {others.length > 0 && <div className="event-preview-others">
        <h4>Also here</h4>
        <ul>{others.map(item => <li key={item.id}><button onClick={() => onSelect(item.id)}>
          <EventIcon type={eventType(item)} emoji={eventEmoji(item)} size={20} />
          <span><strong>{item.title}</strong><small>{formatEventWhen(item.available_from, item.description, 'MMM d · h:mm a')}</small></span>
        </button></li>)}</ul>
      </div>}
    </div>, document.body,
  )
}

function MapZoom() {
  const map = useMap()
  return <div className="map-zoom" ref={node => { if (node) L.DomEvent.disableClickPropagation(node) }}>
    <button aria-label="Zoom in" onClick={() => map.zoomIn()}>+</button>
    <button aria-label="Zoom out" onClick={() => map.zoomOut()}>−</button>
  </div>
}

function Map() {
  const [now, setNow] = useState(() => new Date())
  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 60_000)
    return () => window.clearInterval(timer)
  }, [])
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
    const initial = typeof window !== 'undefined' ? readUrlFilters(window.location.search) : { preset: null, day: null, from: null, to: null, search: '' }
    const dates = initial.day
      ? dayToRange(initial.day)
      : (initial.from && initial.to)
        ? rangeFromKeys(initial.from, initial.to)
        : initial.preset ? presetToRange(initial.preset) : { start: null, end: null }
    return {
      search: initial.search,
      dates,
      userLocation: null,
      radiusMiles: 2,
      types: [],
    }
  })
  const [selectedId, setSelectedId] = useState<number | null>(null)
  const [highlightedId, setHighlightedId] = useState<number | null>(null)
  const [view, setView] = useState<'map' | 'list'>('map')

  // Keep the URL in sync with the filters that make sense to share -
  // selected day (or weekend preset) + search. Location / radius stay local.
  useEffect(() => {
    const rd = rangeToDays(filters.dates)
    writeUrlFilters({
      day: rangeToDay(filters.dates),
      preset: rangeToPreset(filters.dates),
      from: rd?.from ?? null,
      to: rd?.to ?? null,
      search: filters.search,
    })
  }, [filters.dates, filters.search])

  const fetchItems = useCallback(async () => {
    try {
      
      // Use the api service instead of direct fetch
      const data = await api.getItems()

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
  }, [])

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

  // How many filter groups are active - drives the toolbar's "Clear all".
  const activeFilterCount =
    (filters.dates.start || filters.dates.end ? 1 : 0) +
    (filters.types.length ? 1 : 0) +
    (filters.userLocation ? 1 : 0) +
    (filters.search.trim() ? 1 : 0)

  const clearAllFilters = () =>
    handleFiltersChange({ search: '', dates: { start: null, end: null }, types: [], userLocation: null, radiusMiles: 2 })

  const filteredItems = useMemo(() => visibleEvents(items, now).map(displayItem).filter(item => {
    if (item.posted_by === 'scraper-meta') return false

    const eventDate = new Date(item.available_from)

    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }
    // Type filter (derived from emoji - see utils/eventTypes.ts).
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
  }), [items, filters, now])

  useEffect(() => {
    if (selectedId !== null && !filteredItems.some(item => item.id === selectedId)) setSelectedId(null)
    setHighlightedId(null)
  }, [filteredItems, selectedId])

  return (
    <main className="explore-page original-map-page">
      {/* Full-width column: unified filter bar, then either Map or List */}
      <div className="relative h-full flex flex-col">
        {/* Unified filter bar: when / type / near-me / search on the left,
            view toggle on the right. Replaces the old sidebar + mobile sheet. */}
        <div className="filter-bar">
          <div className="filter-bar-inner">
          <div className="filter-group">
            <DatePicker
              value={filters.dates}
              onChange={(dates) => handleFiltersChange({ dates })}
            />
            <TypeChips value={filters.types} onChange={(types) => handleFiltersChange({ types })} />
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
            {activeFilterCount > 0 && (
              <button
                type="button"
                onClick={clearAllFilters}
                className="shrink-0 inline-flex items-center gap-1 px-2 py-1.5 font-sans text-[10px] uppercase tracking-[0.14em] text-bridge-700 hover:text-bridge-500 transition-colors"
              >
                <X size={12} strokeWidth={2.4} />
                Clear{activeFilterCount > 1 ? ` (${activeFilterCount})` : ''}
              </button>
            )}
          </div>
          <div className="view-switch">
            <button
              onClick={() => setView('map')}
              aria-pressed={view === 'map'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 md:py-1.5 font-sans text-[10px] uppercase tracking-[0.14em] font-semibold transition-colors ${
                view === 'map' ? 'bg-ink text-paper-light' : 'text-ink-mute hover:text-ink'
              }`}
              aria-label="Map view"
            >
              <MapIconLucide size={14} strokeWidth={2.2} />
              <span>Map</span>
            </button>
            <button
              onClick={() => setView('list')}
              aria-pressed={view === 'list'}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 md:py-1.5 font-sans text-[10px] uppercase tracking-[0.14em] font-semibold transition-colors ${
                view === 'list' ? 'bg-ink text-paper-light' : 'text-ink-mute hover:text-ink'
              }`}
              aria-label="List view"
            >
              <ListIcon size={14} strokeWidth={2.2} />
              <span>List</span>
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
              minZoom={3}
              maxZoom={19}
              maxBounds={[[-85, -180], [85, 180]]}
              maxBoundsViscosity={1}
              style={{ height: '100%', width: '100%' }}
              zoomControl={false}
            >
              <QuietBasemap />
              <MarkerLayer items={filteredItems} selectedId={selectedId} highlightedId={highlightedId} onSelect={setSelectedId} onHighlight={setHighlightedId} />

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
              <MapZoom />
            </MapContainer>


            {/* Status overlay */}
            {(loading || error || !filteredItems.length) && (
              <div className="map-status">
                <div className="map-status-content">
                  {loading && <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-ink-mute">Loading…</span>}
                  {!loading && error && (
                    <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-bridge-700">Events could not load. {error}</span>
                  )}
                  {!loading && !error && !filteredItems.length && (
                    <span className="font-sans text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-ink">{activeFilterCount ? 'No matching events. Try clearing your filters.' : 'No upcoming events yet. Post one to get things started.'}</span>
                  )}
                </div>
              </div>
            )}
            {!loading && !error && filteredItems.length > 0 && <div className="map-caption" aria-live="polite">{filteredItems.length} events</div>}
            <div className="hidden md:block"><SubmissionsList items={filteredItems} loading={loading} error={error} /></div>
          </div>
        ) : (
          <div className="flex-1 min-h-0 overflow-y-auto bg-paper">
            <ListView items={filteredItems} loading={loading} error={error} />
          </div>
        )}
      </div>

    </main>
  )
}

export default Map
