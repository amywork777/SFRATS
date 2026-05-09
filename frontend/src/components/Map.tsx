import { useEffect, useState, useCallback, useRef } from 'react'
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet'
import { createRoot, Root } from 'react-dom/client'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { DbItem } from '../types/supabase'
import { categoryColors } from '../utils/constants'
import { api } from '../services/api'
import TopBar from './TopBar'
import InterestButton from './InterestButton'
import MessageModal from './MessageModal'
import Sidebar from './Sidebar'
import DirectionsButton from './DirectionsButton'
import ListingPreview from './ListingPreview'
import { categoryPinSvg } from '../utils/categoryIcons'
import SubmissionsList from './SubmissionsList'
import MobileNav from './MobileNav'

// Add this type at the top of the file
interface ListingPreviewProps {
  id: number;
  title: string;
  description: string;
  category: string;
  location_address: string;
  location_lat: number;
  location_lng: number;
  available_from: Date;  // Change this from string to Date
  status: string;
  images?: string[];
  showDirections?: boolean;
  inPopup?: boolean;
  onViewDetails?: () => void;
}

// Create custom marker icons for each category
const createMarkerIcon = (category: string) => {
  // The visible teardrop is 40×48. The hit area is 60×64 — the extra
  // padding around the tip + sides means near-misses still register.
  // iconAnchor (30, 60) lines the bottom tip up with the actual lat/lng.
  return L.divIcon({
    className: 'custom-marker',
    html: categoryPinSvg(category, { height: 48 }),
    iconSize: [60, 64],
    iconAnchor: [30, 60],
    popupAnchor: [0, -52],
  })
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
          icon: createMarkerIcon(item.category)
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

          // Create popup div
          const popupDiv = document.createElement('div')
          popupDiv.id = `popup-${item.id}`
          popupDiv.className = 'fixed z-[2000] bg-white rounded-lg shadow-lg p-4'
          document.body.appendChild(popupDiv)

          // Get marker position relative to viewport
          const markerPoint = map.latLngToContainerPoint(marker.getLatLng())
          const mapContainer = map.getContainer()
          const rect = mapContainer.getBoundingClientRect()
          
          // Position popup relative to viewport
          const x = rect.left + markerPoint.x + 20
          const y = rect.top + markerPoint.y - 20
          
          popupDiv.style.left = `${x}px`
          popupDiv.style.top = `${y}px`

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
                className="absolute top-1 right-1 w-7 h-7 flex items-center justify-center text-ink-mute hover:text-ink hover:bg-paper-dark transition-colors"
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

          // Update popup position when map moves
          const updatePosition = () => {
            const newMarkerPoint = map.latLngToContainerPoint(marker.getLatLng())
            const newRect = mapContainer.getBoundingClientRect()
            const newX = newRect.left + newMarkerPoint.x + 20
            const newY = newRect.top + newMarkerPoint.y - 20
            popupDiv.style.left = `${newX}px`
            popupDiv.style.top = `${newY}px`
          }

          map.on('move', updatePosition)
          map.on('zoom', updatePosition)

          // Store cleanup function
          cleanupFnsRef.current[item.id] = () => {
            map.off('move', updatePosition)
            map.off('zoom', updatePosition)
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
  const [selectedItem, setSelectedItem] = useState<DbItem | null>(null)
  const [showMessageModal, setShowMessageModal] = useState(false)
  const [filters, setFilters] = useState<{
    search: string;
    dates: {
      start: Date | null;
      end: Date | null;
    };
    categories: string[];
  }>({
    search: '',
    dates: { start: null, end: null },
    categories: []
  })
  const mapRef = useRef<L.Map | null>(null)
  const markersRef = useRef<L.Marker[]>([])
  const popupRootsRef = useRef<{ [key: string]: Root }>({})

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
    // Filter out expired events
    const now = new Date()
    const eventDate = new Date(item.available_from)
    const eventEndDate = item.available_until ? new Date(item.available_until) : null
    
    if (eventEndDate && eventEndDate < now) {
      return false // Filter out if end date has passed
    }
    
    // Apply existing filters
    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false
    }

    if (filters.dates.start) {
      if (eventDate.getTime() < filters.dates.start.getTime()) return false
    }
    if (filters.dates.end) {
      if (eventDate.getTime() > filters.dates.end.getTime()) return false
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

      {/* Map Container */}
      <div className="relative h-full md:ml-[300px] lg:ml-[320px]">
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
        </MapContainer>

        {/* "Counter" stamp — smaller on mobile, larger on desktop */}
        <div className="pointer-events-none absolute top-3 left-3 md:top-4 md:left-4 z-[1000]">
          <div className="bg-paper-light border border-ink px-2.5 py-1 md:px-3 md:py-1.5 shadow-stamp -rotate-2">
            <div className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-ink-mute leading-none">Active</div>
            <div className="font-display font-black text-[22px] md:text-[28px] leading-none text-ink mt-0.5 tabular-nums">
              {String(filteredItems.length).padStart(3, '0')}
            </div>
            <div className="font-mono text-[8px] md:text-[9px] uppercase tracking-[0.2em] text-ink-mute leading-none mt-0.5">listings</div>
          </div>
        </div>

        {/* Status overlay */}
        {(loading || error || !items.length) && (
          <div className="pointer-events-none absolute top-3 md:top-4 left-1/2 -translate-x-1/2 z-[1000] max-w-[80%]">
            <div className="pointer-events-auto bg-paper-light border border-ink shadow-stamp px-3 py-1.5 md:px-4 md:py-2 rotate-[-1deg]">
              {loading && <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-ink-mute">Loading…</span>}
              {!loading && error && (
                <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-bridge-700">Couldn't load: {error}</span>
              )}
              {!loading && !error && !items.length && (
                <span className="font-mono text-[10px] md:text-[11px] uppercase tracking-[0.14em] text-ink">No listings yet — be the first.</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Recent Submissions Panel (desktop only) */}
      <div className="hidden md:block">
        <SubmissionsList />
      </div>
    </div>
  )
}

export default Map 