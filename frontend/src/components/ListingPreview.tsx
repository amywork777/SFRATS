import { format } from 'date-fns'
import { useNavigate, useLocation } from 'react-router-dom'
import DirectionsButton from './DirectionsButton'
import { useState } from 'react'
import EditListing from './EditListing'

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
  onRefresh?: () => void
  item?: any
  edit_code?: string
  isNewListing?: boolean
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
  showTimestamp = true,
  onRefresh,
  item,
  edit_code,
  isNewListing = false,
}: ListingPreviewProps) {
  const navigate = !inPopup ? useNavigate() : null
  const [copied, setCopied] = useState(false)
  const [showEditModal, setShowEditModal] = useState(false)
  
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
    <div className="space-y-2 p-2.5 bg-white rounded-lg transition-shadow max-w-[200px]">
      {/* Title and Category */}
      <div className="flex items-start gap-1.5">
        <span className="text-sm shrink-0">{categoryEmojis[category] || '📍'}</span>
        <div className="min-w-0 flex-1">
          <h3 className="font-medium text-[10px] leading-tight truncate">{title}</h3>
        </div>
      </div>

      {/* Status badge */}
      {status && (
        <div className="flex justify-start">
          <span className={`px-1.5 py-0.5 text-[8px] rounded-full ${statusColors[status]}`}>
            {status.charAt(0).toUpperCase() + status.slice(1)}
          </span>
        </div>
      )}

      {/* Description */}
      {description && (
        <p className="text-[8px] text-gray-600 line-clamp-1 px-0.5">
          {description}
        </p>
      )}

      {/* Location */}
      {location_address && (
        <div className="flex items-center gap-1">
          <span className="text-[8px]">📍</span>
          <span className="text-[8px] text-gray-600 truncate">{location_address}</span>
        </div>
      )}

      {/* Date */}
      <div className="flex items-center gap-1">
        <span className="text-[8px]">📅</span>
        <span className="text-[8px] text-gray-600">{format(new Date(available_from), 'MMM d')}</span>
      </div>

      {/* Action Buttons */}
      {showActions && (
        <div className="flex gap-1 mt-1.5">
          <button
            onClick={handleViewDetails}
            className="flex-1 bg-blue-500 text-white py-0.5 px-1.5 rounded
                     hover:bg-blue-600 transition-colors text-[8px] font-medium"
          >
            <span className="sm:hidden">Details</span>
            <span className="hidden sm:inline">View Details</span>
          </button>
          
          <div className="flex gap-1">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setShowEditModal(true);
              }}
              className="p-1 bg-gray-100 text-gray-700 rounded 
                       hover:bg-gray-200 transition-colors text-[8px]"
              title="Edit Listing"
            >
              ✏️
            </button>

            <button
              onClick={handleShare}
              className="p-0.5 bg-gray-100 text-gray-700 rounded 
                       hover:bg-gray-200 transition-colors text-[8px]"
              title="Share listing"
            >
              {copied ? '✓' : '🔗'}
            </button>

            {showDirections && location_lat && location_lng && (
              <button
                onClick={openInGoogleMaps}
                className="p-0.5 bg-gray-100 text-gray-700 rounded 
                         hover:bg-gray-200 transition-colors text-[8px]"
                title="Open in Google Maps"
              >
                🗺️
              </button>
            )}
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 z-[100]">
          <EditListing
            item={{
              ...item,
              id,
              title,
              description,
              category,
              location_address: location_address || '',
              location_lat: location_lat || 0,
              location_lng: location_lng || 0,
              available_from,
              available_until,
              created_at,
              status: item?.status || 'available',
              edit_code: item?.edit_code || '',
              contact_info: item?.contact_info || '',
              url: item?.url || '',
              images: item?.images || [],
              interest_count: item?.interest_count || 0
            }}
            onClose={() => setShowEditModal(false)}
            onSave={() => {
              onRefresh?.();
              setShowEditModal(false);
            }}
          />
        </div>
      )}

      {/* Show edit code for new listings */}
      {isNewListing && edit_code && (
        <div className="mt-4 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
          <p className="font-medium text-yellow-800">Save this edit code to modify your listing later:</p>
          <div className="mt-2 p-2 bg-white border border-yellow-300 rounded flex justify-between items-center">
            <code className="font-mono text-lg">{edit_code}</code>
            <button
              onClick={async () => {
                await navigator.clipboard.writeText(edit_code)
                setCopied(true)
                setTimeout(() => setCopied(false), 2000)
              }}
              className="text-yellow-600 hover:text-yellow-800"
            >
              {copied ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default ListingPreview 