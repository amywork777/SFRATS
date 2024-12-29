const GEOCODING_DELAY = 1000 // 1 second between requests

let lastGeocodingRequest = 0

interface GeocodingResult {
  lat: number
  lng: number
  display_name: string
}

export async function geocodeAddress(address: string): Promise<GeocodingResult> {
  // Ensure we don't exceed rate limits
  const now = Date.now()
  const timeSinceLastRequest = now - lastGeocodingRequest
  if (timeSinceLastRequest < GEOCODING_DELAY) {
    await new Promise(resolve => 
      setTimeout(resolve, GEOCODING_DELAY - timeSinceLastRequest)
    )
  }
  
  lastGeocodingRequest = Date.now()
  
  const encodedAddress = encodeURIComponent(address)
  const response = await fetch(
    `https://nominatim.openstreetmap.org/search?q=${encodedAddress}&format=json&limit=1`
  )

  if (!response.ok) {
    throw new Error('Geocoding failed')
  }

  const data = await response.json()
  if (!data.length) {
    throw new Error('Address not found')
  }

  return {
    lat: parseFloat(data[0].lat),
    lng: parseFloat(data[0].lon),
    display_name: data[0].display_name
  }
} 