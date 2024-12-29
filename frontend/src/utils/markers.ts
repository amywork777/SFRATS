import L from 'leaflet'

// Define colors for each category (more distinct)
export const categoryColors = {
  Items: '#FF6B6B',     // Coral red
  Food: '#4ECDC4',      // Turquoise
  Events: '#FFB347',    // Orange
  Services: '#A78BFA',  // Purple
}

// Get emoji for each category
export const getCategoryEmoji = (category: string) => {
  switch (category) {
    case 'Items':
      return '📦'
    case 'Food':
      return '🍽️'
    case 'Events':
      return '🎉'
    case 'Services':
      return '🔧'
    default:
      return '📍'
  }
}

// Create custom icons for each category (emoji-focused)
export const getCategoryIcon = (category: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `
      <div class="marker-pin">
        <span class="marker-icon">${getCategoryEmoji(category)}</span>
      </div>
    `,
    iconSize: [40, 40],
    iconAnchor: [20, 40]
  })
} 