import { format } from 'date-fns'
import { useNavigate, useLocation } from 'react-router-dom'
import DirectionsButton from './DirectionsButton'
import { useState } from 'react'

interface ListingPreviewProps {
  id: number
  title: string
  description: string
  category: string
  location_address?: string
  location_lat?: number
  location_lng?: number
  available_from: Date
  available_until: Date | null
  created_at: string
  showDirections?: boolean
  showActions?: boolean
  inPopup?: boolean
  onViewDetails?: () => void
  showCategory?: boolean
  showTimestamp?: boolean
}

function ListingPreview({
  id,
  title,
  description,
  category,
  location_address,
  location_lat,
  location_lng,
  available_from,
  available_until,
  created_at,
  showDirections = true,
  showActions = true,
  inPopup = false,
  onViewDetails,
  showCategory = true,
  showTimestamp = true
}: ListingPreviewProps) {
  const navigate = !inPopup ? useNavigate() : null
  const [copied, setCopied] = useState(false)
  
  const categoryEmojis: { [key: string]: string } = {
    'Events': '🎉',
    'Food': '🍕',
    'Items': '📦',
    'Services': '🔧'
  }

  const handleShare = async (e: React.MouseEvent) => {
    e.stopPropagation()
    const url = `${window.location.origin}/listing/${id}`
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const handleViewDetails = () => {
    if (inPopup && onViewDetails) {
      onViewDetails()
    } else if (navigate) {
      navigate(`/listing/${id}`)
    }
  }

  const openInGoogleMaps = (e: React.MouseEvent) => {
    e.stopPropagation();
    
    if (!location_lat || !location_lng) return;
    
    const mapsUrl = `https://www.google.com/maps?q=${location_lat},${location_lng}`;
    window.open(mapsUrl, '_blank');
  };

  return (
    <div className="space-y-2.5">
      {/* Title with category icon */}
      <div className="flex items-center gap-2">
        <span>{categoryEmojis[category] || '📍'}</span>
        <h3 className="font-bold text-lg">{title}</h3>
      </div>
      
      {/* Description */}
      {description && (
        <p className="text-sm text-gray-600">{description}</p>
      )}

      {/* Location */}
      {location_address && (
        <div className="flex items-start gap-2 text-sm text-gray-600">
          <span className="mt-1">📍</span>
          <span>{location_address}</span>
        </div>
      )}

      {/* Available date */}
      <div className="flex items-center gap-2 text-sm text-gray-600">
        <span>📅</span>
        <span>Available: {format(new Date(available_from), 'MMM d')}</span>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-2">
          <button
            onClick={handleViewDetails}
            className="flex-1 bg-blue-500 text-white py-1.5 px-3 rounded
                     hover:bg-blue-600 transition-colors text-sm font-medium"
          >
            View Details
          </button>
          <button
            onClick={handleShare}
            className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded 
                     hover:bg-gray-200 transition-colors text-sm"
          >
            {copied ? '✓' : '🔗'}
          </button>
          {showDirections && location_lat && location_lng && (
            <button
              onClick={openInGoogleMaps}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded 
                       hover:bg-gray-200 transition-colors text-sm"
            >
              🗺️
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default ListingPreview 