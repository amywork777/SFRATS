import { useState, useEffect, useRef } from 'react'
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

const createMarkerIcon = () =>
  L.divIcon({
    className: 'custom-marker',
    html: `<div class="marker-pin">📍</div>`,
    iconSize: [32, 32],
    iconAnchor: [16, 32],
    popupAnchor: [0, -32],
  })

interface LocationPickerProps {
  initialAddress?: string
  initialLat?: number | null
  initialLng?: number | null
  onLocationSelected: (location: { address: string; lat: number; lng: number }) => void
}

function LocationPicker({ initialAddress, initialLat, initialLng, onLocationSelected }: LocationPickerProps) {
  const [address, setAddress] = useState(initialAddress || '')
  const [position, setPosition] = useState<[number, number] | null>(
    initialLat && initialLng ? [initialLat, initialLng] : null
  )
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (initialLat && initialLng) setPosition([initialLat, initialLng])
    if (initialAddress) setAddress(initialAddress)
  }, [initialLat, initialLng, initialAddress])

  const getAddressFromCoords = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      if (!res.ok) throw new Error('Failed to get address')
      const data = await res.json()
      const newAddress = data.display_name
      setAddress(newAddress)
      onLocationSelected({ address: newAddress, lat, lng })
    } catch {
      setError('Failed to get address')
    }
  }

  const getCoordsFromAddress = async (searchAddress: string) => {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchAddress)}&format=json`
      )
      if (!res.ok) throw new Error('Failed to get coordinates')
      const data = await res.json()
      if (data.length === 0) throw new Error('No results found')
      const { lat, lon: lng } = data[0]
      const next: [number, number] = [parseFloat(lat), parseFloat(lng)]
      setPosition(next)
      setAddress(data[0].display_name)
      onLocationSelected({ address: data[0].display_name, lat: parseFloat(lat), lng: parseFloat(lng) })
      mapRef.current?.setView(next, 14)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to get coordinates')
    } finally {
      setLoading(false)
    }
  }

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
    <div className="space-y-3">
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          placeholder="Enter an address…"
          className="flex-1 bg-paper-light border-2 border-ink px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
        />
        <button
          type="button"
          onClick={() => getCoordsFromAddress(address)}
          disabled={loading || !address}
          className="px-4 py-2 bg-ink text-paper-light border-2 border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && (
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-bridge-700">⚠ {error}</div>
      )}

      <div className="h-[300px] border-2 border-ink overflow-hidden relative z-0">
        <MapContainer
          center={position || [37.7749, -122.4194]}
          zoom={13}
          style={{ height: '100%', width: '100%' }}
          ref={mapRef}
          className="z-0"
        >
          <TileLayer
            url="https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png"
            attribution='&copy; OSM &copy; CARTO'
            subdomains="abcd"
            detectRetina
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

      <p className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
        ▸ Click on the map or search above to set the location.
      </p>
    </div>
  )
}

export default LocationPicker
