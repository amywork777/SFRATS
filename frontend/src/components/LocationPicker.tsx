import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

// Create emoji marker icon
const createMarkerIcon = () => {
  return L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin">📍</div>`,
    iconSize: [40, 40],
    iconAnchor: [20, 40],
    popupAnchor: [0, -40],
    tooltipAnchor: [0, 0],
    className: 'custom-marker-no-bg'
  })
}

interface LocationPickerProps {
  initialAddress?: string;
  initialLat?: number | null;
  initialLng?: number | null;
  onLocationSelected: (location: {
    address: string;
    lat: number;
    lng: number;
  }) => void;
}

function LocationPicker({ initialAddress, initialLat, initialLng, onLocationSelected }: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress || '')
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  // Add effect to handle updates to initial values
  useEffect(() => {
    if (initialLat && initialLng) {
      setPosition([initialLat, initialLng])
    }
    if (initialAddress) {
      setAddress(initialAddress)
    }
  }, [initialLat, initialLng, initialAddress])

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      if (!response.ok) throw new Error('Failed to get address')
      const data = await response.json()
      const newAddress = data.display_name
      setAddress(newAddress)
      onLocationSelected({
        address: newAddress,
        lat,
        lng
      })
    } catch (err) {
      console.error('Failed to get address:', err)
      setError('Failed to get address')
    }
  }

  const getCoordsFromAddress = async (searchAddress: string) => {
    setLoading(true)
    setError(null)
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json`
      )
      if (!response.ok) throw new Error('Failed to get coordinates')
      const data = await response.json()
      if (data.length === 0) throw new Error('No results found')
      
      const { lat, lon: lng } = data[0]
      const newPosition: [number, number] = [parseFloat(lat), parseFloat(lng)]
      setPosition(newPosition)
      setAddress(data[0].display_name)
      onLocationSelected({
        address: data[0].display_name,
        lat: parseFloat(lat),
        lng: parseFloat(lng)
      })
      
      if (mapRef.current) {
        mapRef.current.setView(newPosition, 13)
      }
    } catch (err) {
      console.error('Failed to get coordinates:', err)
      setError(err instanceof Error ? err.message : 'Failed to get coordinates')
    } finally {
      setLoading(false)
    }
  }

  // Map click handler component
  function MapClickHandler() {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        await getAddressFromCoords(lat, lng)
      },
    })
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter an address"
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          type="button"
          onClick={() => getCoordsFromAddress(address)}
          disabled={loading || !address}
          className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Searching...' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="text-red-500 text-sm">{error}</div>
      )}

      <div className="h-[300px] rounded-lg overflow-hidden border">
        <MapContainer
          center={position || [37.7749, -122.4194]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler />
          {position && (
            <Marker 
              position={position} 
              icon={createMarkerIcon()}
              interactive={false}
            />
          )}
        </MapContainer>
      </div>

      <p className="text-sm text-gray-500">
        Click on the map or search for an address to set the location
      </p>
    </div>
  )
}

export default LocationPicker 