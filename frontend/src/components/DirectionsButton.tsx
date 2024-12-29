interface DirectionsButtonProps {
  lat: number
  lng: number
  address?: string
  className?: string
  variant?: 'default' | 'prominent'
}

function DirectionsButton({ lat, lng, address, className = '', variant = 'default' }: DirectionsButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation() // Prevent event bubbling
    // Try to use address first if available
    if (address) {
      window.open(`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(address)}`, '_blank')
    } else {
      // Fallback to coordinates
      window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank')
    }
  }

  const baseStyles = variant === 'prominent' 
    ? "bg-blue-500 text-white hover:bg-blue-600 py-2 px-4 rounded-md transition-colors"
    : "text-blue-500 hover:text-blue-600"

  return (
    <button
      onClick={handleClick}
      className={`flex items-center gap-2 ${baseStyles} ${className}`}
    >
      <span>🗺️</span> Open in Google Maps
    </button>
  )
}

export default DirectionsButton 