interface LocationButtonsProps {
  lat: number
  lng: number
  address: string
}

function LocationButtons({ lat, lng, address }: LocationButtonsProps) {
  const generateMapLinks = (fromLat: number | null, fromLng: number | null) => {
    const destination = `${lat},${lng}`
    const origin = fromLat && fromLng ? `${fromLat},${fromLng}` : ''
    return {
      google: `https://www.google.com/maps/dir/?api=1&destination=${destination}${origin ? `&origin=${origin}` : ''}`,
      apple: `maps://?daddr=${destination}${origin ? `&saddr=${origin}` : ''}`,
      universal: `geo:${destination}?q=${encodeURIComponent(address)}`,
    }
  }

  const handleGetDirections = (useCurrentLocation: boolean = false) => {
    const isApple = /iPad|iPhone|iPod/.test(navigator.userAgent)
    const openLinks = (links: ReturnType<typeof generateMapLinks>) => {
      if (isApple) {
        window.location.href = links.apple
        setTimeout(() => { window.location.href = links.google }, 500)
      } else {
        window.open(links.google, '_blank')
      }
    }

    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => openLinks(generateMapLinks(position.coords.latitude, position.coords.longitude)),
        () => openLinks(generateMapLinks(null, null))
      )
    } else {
      openLinks(generateMapLinks(null, null))
    }
  }

  const links = generateMapLinks(null, null)

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleGetDirections(false)}
          className="bg-ink text-paper-light border-2 border-ink shadow-stamp px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] font-semibold flex items-center justify-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
        >
          🧭 Directions
        </button>
        <button
          onClick={() => handleGetDirections(true)}
          className="bg-bridge-500 text-paper-light border-2 border-ink shadow-stamp px-4 py-2.5 font-mono text-[11px] uppercase tracking-[0.14em] font-semibold flex items-center justify-center gap-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
        >
          📍 From me
        </button>
      </div>

      <div className="flex justify-center gap-3 font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute">
        <a
          href={links.google}
          target="_blank"
          rel="noopener noreferrer"
          className="hover:text-bridge-600 underline underline-offset-4 decoration-1"
        >
          Google
        </a>
        <span aria-hidden>·</span>
        <a
          href={links.apple}
          className="hover:text-bridge-600 underline underline-offset-4 decoration-1"
        >
          Apple
        </a>
      </div>
    </div>
  )
}

export default LocationButtons
