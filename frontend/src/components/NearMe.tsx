import { useState } from 'react'
import { LocateFixed, X, Loader2 } from 'lucide-react'

interface NearMeProps {
  location: { lat: number; lng: number } | null
  radiusMiles: number
  onChange: (next: { location: { lat: number; lng: number } | null; radiusMiles: number }) => void
}

export default function NearMe({ location, radiusMiles, onChange }: NearMeProps) {
  const [locating, setLocating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const useMyLocation = () => {
    if (!navigator.geolocation) {
      setError('Geolocation isn\'t supported in this browser.')
      return
    }
    setLocating(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        onChange({
          location: { lat: pos.coords.latitude, lng: pos.coords.longitude },
          radiusMiles,
        })
        setLocating(false)
      },
      (err) => {
        setError(err.message || 'Couldn\'t get your location.')
        setLocating(false)
      },
      { enableHighAccuracy: true, timeout: 8000 }
    )
  }

  const clear = () => onChange({ location: null, radiusMiles })

  if (!location) {
    return (
      <div className="space-y-2">
        <button
          type="button"
          onClick={useMyLocation}
          disabled={locating}
          className="w-full inline-flex items-center justify-center gap-2 px-3 py-2.5 bg-paper-light text-ink border border-ink hover:bg-paper font-mono text-[11px] uppercase tracking-[0.14em] font-semibold transition-colors disabled:opacity-50"
        >
          {locating ? <Loader2 size={13} strokeWidth={2.2} className="animate-spin" /> : <LocateFixed size={13} strokeWidth={2.2} />}
          {locating ? 'Locating…' : 'Use my location'}
        </button>
        {error && (
          <p className="font-mono text-[10px] uppercase tracking-[0.12em] text-bridge-700">⚠ {error}</p>
        )}
      </div>
    )
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
          📍 Located · {radiusMiles} mi radius
        </span>
        <button
          type="button"
          onClick={clear}
          className="font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-600 hover:text-bridge-700 inline-flex items-center gap-1"
        >
          <X size={10} strokeWidth={2.5} /> Clear
        </button>
      </div>

      <input
        type="range"
        min={0.5}
        max={10}
        step={0.5}
        value={radiusMiles}
        onChange={(e) => onChange({ location, radiusMiles: parseFloat(e.target.value) })}
        className="sfrats-range w-full"
        aria-label="Radius in miles"
      />

      <div className="flex justify-between font-mono text-[9px] uppercase tracking-[0.14em] text-ink-fade">
        <span>0.5 mi</span>
        <span>5 mi</span>
        <span>10 mi</span>
      </div>
    </div>
  )
}
