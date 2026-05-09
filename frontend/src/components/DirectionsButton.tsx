interface DirectionsButtonProps {
  lat: number
  lng: number
  address?: string
  className?: string
  variant?: 'default' | 'prominent'
}

function DirectionsButton({ lat, lng, address, className = '', variant = 'default' }: DirectionsButtonProps) {
  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    const q = address
      ? encodeURIComponent(address)
      : `${lat},${lng}`
    window.open(`https://www.google.com/maps/search/?api=1&query=${q}`, '_blank')
  }

  const styles = variant === 'prominent'
    ? 'bg-bridge-500 text-paper-light border-2 border-ink shadow-stamp px-4 py-2 hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all font-mono text-[11px] uppercase tracking-[0.14em] font-semibold'
    : 'text-bridge-600 hover:text-bridge-700 underline underline-offset-4 decoration-2 font-mono text-[11px] uppercase tracking-[0.14em]'

  return (
    <button onClick={handleClick} className={`inline-flex items-center gap-2 ${styles} ${className}`}>
      <span>🗺️</span> Open in Google Maps
    </button>
  )
}

export default DirectionsButton
