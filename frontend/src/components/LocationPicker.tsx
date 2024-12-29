import { useState, useEffect } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

interface LocationPickerProps {
  onChange: (location: { 
    address: string; 
    lat: number; 
    lng: number 
  }) => void
}

function LocationPicker({ onChange }: LocationPickerProps) {
  const [searchQuery, setSearchQuery] = useState('')
  const [position, setPosition] = useState<[number, number] | null>(null)
  const [address, setAddress] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  // Search for address using Nominatim
  const searchAddress = async () => {
    if (!searchQuery.trim()) return

    setLoading(true)
    setError('')

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`
      )
      const data = await response.json()

      if (data && data[0]) {
        const { lat, lon, display_name } = data[0]
        setPosition([parseFloat(lat), parseFloat(lon)])
        setAddress(display_name)
        onChange({
          address: display_name,
          lat: parseFloat(lat),
          lng: parseFloat(lon)
        })
      } else {
        setError('Address not found')
      }
    } catch (err) {
      setError('Failed to search address')
    } finally {
      setLoading(false)
    }
  }

  // Get address from coordinates using reverse geocoding
  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
      const data = await response.json()
      
      if (data.display_name) {
        setAddress(data.display_name)
        onChange({
          address: data.display_name,
          lat,
          lng
        })
      }
    } catch (err) {
      console.error('Failed to get address:', err)
    }
  }

  // Map click handler component
  function MapClickHandler() {
    useMapEvents({
      click: (e) => {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        getAddressFromCoords(lat, lng)
      },
    })
    return null
  }

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && searchAddress()}
          placeholder="Search address..."
          className="flex-1 px-3 py-2 border rounded-lg focus:ring-blue-500 focus:border-blue-500"
        />
        <button
          onClick={searchAddress}
          disabled={loading}
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
          center={position || [37.7749, -122.4194]} // Default to SF
          zoom={13}
          style={{ height: '100%', width: '100%' }}
        >
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
          />
          <MapClickHandler />
          {position && (
            <Marker 
              position={position}
              draggable={true}
              eventHandlers={{
                dragend: (e) => {
                  const marker = e.target
                  const position = marker.getLatLng()
                  setPosition([position.lat, position.lng])
                  getAddressFromCoords(position.lat, position.lng)
                },
              }}
            />
          )}
        </MapContainer>
      </div>

      {address && (
        <div className="text-sm text-gray-600">
          Selected location: {address}
        </div>
      )}
    </div>
  )
}

export default LocationPicker 