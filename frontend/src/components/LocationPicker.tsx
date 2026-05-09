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
  const [searching, setSearching] = useState(false)
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const mapRef = useRef<L.Map | null>(null)

  useEffect(() => {
    if (initialLat && initialLng) setPosition([initialLat, initialLng])
    if (initialAddress) setAddress(initialAddress)
  }, [initialLat, initialLng, initialAddress])

  const reverseGeocode = async (lat: number, lng: number) => {
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/reverse?lat=${lat}&lon=${lng}&format=json`
      )
      if (!res.ok) throw new Error('Failed to look up address')
      const data = await res.json()
      const newAddress = data.display_name
      setAddress(newAddress)
      onLocationSelected({ address: newAddress, lat, lng })
      return newAddress
    } catch {
      // Fall back to coordinates if reverse lookup fails
      const fallback = `${lat.toFixed(4)}, ${lng.toFixed(4)}`
      setAddress(fallback)
      onLocationSelected({ address: fallback, lat, lng })
      return fallback
    }
  }

  const searchAddress = async (q: string) => {
    if (!q.trim()) return
    setSearching(true)
    setError(null)
    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(q)}&format=json&limit=1`
      )
      if (!res.ok) throw new Error('Search failed')
      const data = await res.json()
      if (data.length === 0) throw new Error('No results — try a different search.')
      const { lat, lon } = data[0]
      const next: [number, number] = [parseFloat(lat), parseFloat(lon)]
      setPosition(next)
      setAddress(data[0].display_name)
      onLocationSelected({ address: data[0].display_name, lat: parseFloat(lat), lng: parseFloat(lon) })
      mapRef.current?.setView(next, 15)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Search failed')
    } finally {
      setSearching(false)
    }
  }

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation isn\'t supported in this browser.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const { latitude: lat, longitude: lng } = pos.coords
        const next: [number, number] = [lat, lng]
        setPosition(next)
        await reverseGeocode(lat, lng)
        mapRef.current?.setView(next, 15)
        setLocating(false)
      },
      (err) => {
        setError(err.message || 'Couldn\'t get your location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  function MapClickHandler() {
    useMapEvents({
      click: async (e) => {
        const { lat, lng } = e.latlng
        setPosition([lat, lng])
        await reverseGeocode(lat, lng)
      },
    })
    return null
  }

  return (
    <div className="space-y-2">
      {/* Search row */}
      <div className="flex gap-2">
        <input
          type="text"
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); searchAddress(address) } }}
          placeholder="Search an address or neighborhood…"
          className="flex-1 bg-paper-light border-2 border-ink px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
        />
        <button
          type="button"
          onClick={() => searchAddress(address)}
          disabled={searching || !address}
          className="px-4 py-2 bg-ink text-paper-light border-2 border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {searching ? '…' : 'Find'}
        </button>
      </div>

      {/* Use my location + helper */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-600 hover:text-bridge-700 underline underline-offset-4 decoration-1 disabled:opacity-50"
        >
          {locating ? 'Locating…' : '◎ Use my location'}
        </button>
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-fade">
          ▸ or click the map
        </span>
      </div>

      {error && (
        <div className="font-mono text-[11px] uppercase tracking-[0.12em] text-bridge-700">⚠ {error}</div>
      )}

      {/* Map */}
      <div className="h-[260px] border-2 border-ink overflow-hidden relative z-0">
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
            <Marker position={position} icon={createMarkerIcon()} interactive={false} />
          )}
        </MapContainer>
      </div>

      {/* Confirmed address chip */}
      {position && address && (
        <div className="bg-paper-light border-2 border-ink p-2.5 flex items-start gap-2">
          <span className="font-mono text-[10px] uppercase tracking-[0.16em] text-bridge-600 mt-0.5 shrink-0">Pinned</span>
          <span className="text-[12px] leading-snug text-ink truncate">{address}</span>
        </div>
      )}
    </div>
  )
}

export default LocationPicker
