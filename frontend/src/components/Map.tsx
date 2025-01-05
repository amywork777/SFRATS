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
import { categoryEmojis, statusColors } from '../utils/mapConstants'
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
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin">${categoryEmojis[category as keyof typeof categoryEmojis] || '📍'}</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 20]
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
                className="absolute top-2 right-2 text-gray-500 hover:text-gray-700"
              >
                ✕
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
    // Apply search filter
    if (filters.search && !item.title.toLowerCase().includes(filters.search.toLowerCase())) {
      return false
    }

    // Apply category filter
    if (filters.categories.length > 0 && !filters.categories.includes(item.category)) {
      return false
    }

    // Apply date filter
    if (filters.dates.start) {
      const itemDate = new Date(item.available_from)
      if (itemDate.getTime() < filters.dates.start.getTime()) return false
    }
    if (filters.dates.end) {
      const itemDate = new Date(item.available_from)
      if (itemDate.getTime() > filters.dates.end.getTime()) return false
    }

    return true
  })

  const getMarkerIcon = (category: string, status: string = 'available') => {
    const emoji = categoryEmojis[category as keyof typeof categoryEmojis] || '📍'
    const color = status === 'claimed' ? '#EAB308' : 
                 status === 'gone' ? '#6B7280' : 
                 '#22C55E' // default green for available

    return new L.DivIcon({
      className: 'custom-marker',
      html: `
        <div class="marker-content" style="background-color: ${color}">
          ${emoji}
        </div>
      `,
      iconSize: [40, 40],
      iconAnchor: [20, 40],
      popupAnchor: [0, -40]
    })
  }

  if (loading) return <div className="p-4">Loading items...</div>
  if (error) return <div className="p-4 text-red-500">Error: {error}</div>
  if (!items.length) return <div className="p-4">No items found</div>

  return (
    <div className="fixed inset-0 top-16">
      {/* Mobile Navigation */}
      <div className="md:hidden">
        <MobileNav onFiltersChange={handleFiltersChange} />
      </div>

      {/* Desktop Sidebar */}
      <div className="hidden md:block">
        <Sidebar onFiltersChange={handleFiltersChange} />
      </div>

      {/* Map Container */}
      <div className="h-full md:ml-80">
        <MapContainer
          center={[37.7749, -122.4194]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          zoomControl={false}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MarkerLayer items={filteredItems} />
        </MapContainer>
      </div>

      {/* Recent Submissions Panel */}
      <SubmissionsList />
    </div>
  )
}

export default Map 