import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMap, Circle } from 'react-leaflet'
import { createRoot, Root } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { DbItem } from '../types/supabase'
import { api } from '../services/api'
import Sidebar from './Sidebar'
import ListingPreview from './ListingPreview'
import { inferEmoji } from '../utils/categoryIcons'
import { isActive, withinRadius, MILE_KM } from '../utils/listingFilters'
import { DbItem as DbItemRow } from '../types/supabase'
import ListView from './ListView'
import { Map as MapIconLucide, List as ListIcon } from 'lucide-react'
import SubmissionsList from './SubmissionsList'
import MobileNav from './MobileNav'
import PageTabs from './PageTabs'
import DateChips from './DateChips'

// Create custom marker icons for each category
const createMarkerIcon = (item: Pick<DbItemRow, 'emoji' | 'title' | 'description' | 'category'>) => {
  const glyph = item.emoji || inferEmoji(item.title, item.description ?? null, item.category)
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin"><span class="marker-emoji">${glyph}</span></div>`,
    iconSize: [56, 56],
    iconAnchor: [28, 28],
    popupAnchor: [0, -22],
  })
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

// Create a new component for handling markers
function MarkerLayer({ items }: { items: DbItem[] }) {
  const map = useMap()
  const popupRootsRef = useRef<{ [key: string]: Root }>({})
  const cleanupFnsRef = useRef<{ [key: string]: () => void }>({})

  useEffect(() => {
    // Clear existing markers
    map.eachLayer((layer) => {
      if (layer instanceof L.Marker) {
        map.removeLayer(layer)
      }
    })

    if (!items || !items.length) {
      console.log('No items to display')
      return
    }

    // Add new markers
    items.forEach(item => {
      if (item.location_lat && item.location_lng) {
        const marker = L.marker([item.location_lat, item.location_lng], {
          icon: createMarkerIcon(item)
        })
        
        marker.on('click', () => {
          // Close any existing popups first
          Object.values(popupRootsRef.current).forEach(root => {
            root.unmount()
          })
          // Run any existing cleanup functions
          Object.values(cleanupFnsRef.current).forEach(cleanup => cleanup())
          
          document.querySelectorAll('[id^="popup-"]').forEach(el => {
            el.remove()
          })
          popupRootsRef.current = {}
          cleanupFnsRef.current = {}

          // Create popup div. CSS branches on `data-mobile` to make this a
          // bottom sheet on phones (see [id^="popup-"][data-mobile] in index.css).
          const isMobile = window.matchMedia('(max-width: 767px)').matches
          const popupDiv = document.createElement('div')
          popupDiv.id = `popup-${item.id}`
          popupDiv.className = 'fixed z-[2000] bg-white rounded-lg shadow-lg p-4'
          if (isMobile) popupDiv.dataset.mobile = 'true'
          document.body.appendChild(popupDiv)

          const mapContainer = map.getContainer()

          // Desktop: anchor next to the marker. Mobile: CSS pins to bottom.
          const placeNearMarker = () => {
            if (popupDiv.dataset.mobile) return
            const pt = map.latLngToContainerPoint(marker.getLatLng())
            const r = mapContainer.getBoundingClientRect()
            popupDiv.style.left = `${r.left + pt.x + 20}px`
            popupDiv.style.top  = `${r.top  + pt.y - 20}px`
          }
          placeNearMarker()

          // Create root and store it
          const root = createRoot(popupDiv)
          popupRootsRef.current[item.id] = root

          // Render content
          root.render(
            <div className="relative">
              <button
                onClick={() => {
                  root.unmount()
                  document.body.removeChild(popupDiv)
                  delete popupRootsRef.current[item.id]
                }}
                aria-label="Close"
                className="absolute top-1 right-1 w-9 h-9 sm:w-7 sm:h-7 flex items-center justify-center text-ink-mute hover:text-ink hover:bg-paper-dark transition-colors"
              >
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
              </button>
              <ListingPreview 
                {...{
                  ...item,
                  available_from: new Date(item.available_from)
                }}
                showDirections={true}
                inPopup={true}
                onViewDetails={() => {
                  root.unmount()
                  document.body.removeChild(popupDiv)
                  delete popupRootsRef.current[item.id]
                  window.location.href = `/listing/${item.id}`
                }}
              />
            </div>
          )

          // Keep desktop popup glued to its marker as the user pans/zooms.
          // (Mobile bottom sheet doesn't need this — CSS pins it.)
          map.on('move', placeNearMarker)
          map.on('zoom', placeNearMarker)

          cleanupFnsRef.current[item.id] = () => {
            map.off('move', placeNearMarker)
            map.off('zoom', placeNearMarker)
          }
        })

        marker.addTo(map)
      }
    })

    return () => {
      // Cleanup
      Object.values(popupRootsRef.current).forEach(root => root.unmount())
      Object.values(cleanupFnsRef.current).forEach(cleanup => cleanup())
      popupRootsRef.current = {}
      cleanupFnsRef.current = {}
      
      document.querySelectorAll('[id^="popup-"]').forEach(el => {
        el.remove()
      })
    }
  }, [items, map])

  // Close popup when clicking on map
  useEffect(() => {
    const handleMapClick = (e: L.LeafletMouseEvent) => {
      // Only close if click wasn't on a marker
      if (!(e.originalEvent.target as Element).closest('.marker-pin')) {
        Object.values(popupRootsRef.current).forEach(root => root.unmount())
        Object.values(cleanupFnsRef.current).forEach(cleanup => cleanup())
        
        popupRootsRef.current = {}
        cleanupFnsRef.current = {}
        
        document.querySelectorAll('[id^="popup-"]').forEach(el => {
          el.remove()
        })
      }
    }

    map.on('click', handleMapClick)
    return () => {
      map.off('click', handleMapClick)
    }
  }, [map])

  return null
}

function Map() {
  const [items, setItems] = useState<DbItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filters, setFilters] = useState<{
    search: string;
    dates: { start: Date | null; end: Date | null };
    userLocation: { lat: number; lng: number } | null;
    radiusMiles: number;
  }>({
    search: '',
    dates: { start: null, end: null },
    userLocation: null,
    radiusMiles: 2,
  })
  const [view, setView] = useState<'map' | 'list'>('map')

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
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav onFiltersChange={handleFiltersChange} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar onFiltersChange={handleFiltersChange} />
      </div>

      {/* Right column: page tabs + view-toggle, then either Map or List */}
      <div className="relative h-full md:ml-[300px] lg:ml-[320px] flex flex-col">
        {/* Top bar: page tabs (left) + view toggle (right). The two tabs
            navigate between /events and /items — events is the headline,
            items is its own dedicated map. */}
        <div className="flex items-center justify-between gap-3 px-3 md:px-5 pt-2.5 pb-2 bg-paper-light shrink-0">
          <PageTabs active="events" />

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

        {/* Quick date filters — Tonight / Tomorrow / Weekend etc. */}
        <DateChips
          start={filters.dates.start}
          end={filters.dates.end}
          onChange={(dates) => handleFiltersChange({ dates })}
        />

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