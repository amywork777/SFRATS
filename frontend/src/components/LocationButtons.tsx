import { MapPin, Navigation } from 'lucide-react'

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
      universal: `geo:${destination}?q=${encodeURIComponent(address)}`
    }
  }

  const handleGetDirections = (useCurrentLocation: boolean = false) => {
    if (useCurrentLocation && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const links = generateMapLinks(position.coords.latitude, position.coords.longitude)
          
          if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
            window.location.href = links.apple
            setTimeout(() => {
              window.location.href = links.google
            }, 500)
          } else {
            window.open(links.google, '_blank')
          }
        },
        (error) => {
          console.error('Error getting location:', error)
          // Fallback to regular directions without current location
          const links = generateMapLinks(null, null)
          window.open(links.google, '_blank')
        }
      )
    } else {
      const links = generateMapLinks(null, null)
      if (/iPad|iPhone|iPod/.test(navigator.userAgent)) {
        window.location.href = links.apple
        setTimeout(() => {
          window.location.href = links.google
        }, 500)
      } else {
        window.open(links.google, '_blank')
      }
    }
  }

  return (
    <div className="flex flex-col gap-2">
      {/* Main Directions Buttons */}
      <div className="grid grid-cols-2 gap-2">
        <button
          onClick={() => handleGetDirections(false)}
          className="flex items-center justify-center gap-2 bg-blue-500 
                     text-white py-2 px-4 rounded-lg hover:bg-blue-600 
                     transition-colors"
        >
          🧭 Get Directions
        </button>
        <button
          onClick={() => handleGetDirections(true)}
          className="flex items-center justify-center gap-2 bg-green-500 
                     text-white py-2 px-4 rounded-lg hover:bg-green-600 
                     transition-colors"
        >
          📍 From My Location
        </button>
      </div>

      {/* Alternative Map Links */}
      <div className="flex justify-center gap-4 text-sm text-gray-500">
        <a
          href={generateMapLinks(null, null).google}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 hover:text-blue-500"
        >
          📍 Google Maps
        </a>
        <span>|</span>
        <a
          href={generateMapLinks(null, null).apple}
          className="flex items-center gap-1 hover:text-blue-500"
        >
          📍 Apple Maps
        </a>
      </div>
    </div>
  )
}

export default LocationButtons 