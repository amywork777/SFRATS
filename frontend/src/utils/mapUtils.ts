import L from 'leaflet'
import { categoryEmojis } from '../components/Legend'

export const createMarkerIcon = (category: string, status: string = 'available') => {
  // Ensure status is valid
  const validStatus = status && ['available', 'gone'].includes(status) ? status : 'available'
  const baseColor = validStatus === 'gone' ? '#6B7280' : '#3B82F6'

  return L.divIcon({
    className: 'custom-marker-icon',
    html: `
      <div style="
        background-color: ${baseColor};
        width: 30px;
        height: 30px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: white;
        font-size: 16px;
        opacity: ${validStatus === 'gone' ? '0.6' : '1'};
      ">
        ${categoryEmojis[category as keyof typeof categoryEmojis] || '📦'}
      </div>
    `,
    iconSize: [30, 30],
    iconAnchor: [15, 15]
  })
} 