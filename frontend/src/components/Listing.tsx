import { MapIcon } from '@heroicons/react/24/outline';
import InterestButton from './InterestButton'
import { DbItem } from '../types/supabase'
import { format } from 'date-fns'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import { useState, useEffect } from 'react'
import EditListing from './EditListing'
import { api } from '../services/api'

interface ListingProps {
  listing: DbItem;
  onRefresh?: () => void;
}

export default function Listing({ listing: initialListing, onRefresh }: ListingProps) {
  const [listing, setListing] = useState(initialListing)
  
  const fetchItem = async () => {
    try {
      const updatedListing = await api.getItem(listing.id.toString())
      setListing(updatedListing)
      onRefresh?.()
    } catch (err) {
      console.error('Error fetching item:', err)
    }
  }

  const categoryEmojis: { [key: string]: string } = {
    'Events': '🎉',
    'Food': '🍕',
    'Items': '📦',
    'Services': '🔧'
  }

  const statusColors = {
    available: 'bg-green-100 text-green-800',
    pending: 'bg-yellow-100 text-yellow-800',
    gone: 'bg-gray-100 text-gray-800'
  }

  const formatDate = (date: string | Date) => {
    return format(new Date(date), 'MMM d, yyyy h:mm a')
  }

  const [showEditModal, setShowEditModal] = useState(false);

  return (
    <div className="space-y-6 p-4 md:p-6 max-w-4xl mx-auto">
      {/* Header Section - stack on mobile */}
      <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="text-2xl">{categoryEmojis[listing.category]}</span>
            <h1 className="text-2xl font-bold">{listing.title}</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className={`px-3 py-1 rounded-full text-sm ${statusColors[listing.status]}`}>
              {listing.status.charAt(0).toUpperCase() + listing.status.slice(1)}
            </span>
            <span className="text-sm text-gray-500">
              Posted {formatDate(listing.created_at)}
            </span>
          </div>
        </div>
        <InterestButton 
          itemId={listing.id} 
          initialCount={listing.interest_count}
        />
      </div>

      {/* Description Section */}
      <div className="bg-gray-50 rounded-lg p-4">
        <p className="text-gray-700 whitespace-pre-wrap">{listing.description}</p>
      </div>

      {/* Location and Map Section */}
      <div className="space-y-3">
        <h2 className="font-semibold text-gray-700 flex items-center gap-2">
          <span>📍</span> Location
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Location Details */}
          <div className="md:col-span-1">
            <div className="bg-blue-50 rounded-lg p-4 h-full">
              <p className="text-sm text-gray-600 mb-3">{listing.location_address}</p>
              <a
                href={`https://www.google.com/maps?q=${listing.location_lat},${listing.location_lng}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-blue-600 hover:text-blue-700"
              >
                🗺️ Open in Google Maps
              </a>
            </div>
          </div>
          {/* Map */}
          <div className="md:col-span-2 h-[200px] bg-gray-100 rounded-lg overflow-hidden">
            <MapContainer
              center={[listing.location_lat, listing.location_lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker position={[listing.location_lat, listing.location_lng]} />
            </MapContainer>
          </div>
        </div>
      </div>

      {/* Other Details Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Availability Section */}
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>📅</span> Availability
          </h2>
          <div className="bg-blue-50 rounded-lg p-4 space-y-1">
            <p className="text-sm text-gray-600">
              Available from: <span className="font-medium">{formatDate(listing.available_from)}</span>
            </p>
            {listing.available_until && (
              <p className="text-sm text-gray-600">
                Available until: <span className="font-medium">{formatDate(listing.available_until)}</span>
              </p>
            )}
          </div>
        </div>

        {/* Contact Section */}
        <div className="space-y-2">
          <h2 className="font-semibold text-gray-700 flex items-center gap-2">
            <span>👤</span> Contact Information
          </h2>
          <div className="bg-blue-50 rounded-lg p-4 space-y-1">
            <p className="text-sm text-gray-600">
              Posted by: <span className="font-medium">{listing.posted_by || 'Anonymous'}</span>
            </p>
            {listing.contact_info && (
              <p className="text-sm text-gray-600">
                Contact: <span className="font-medium">{listing.contact_info}</span>
              </p>
            )}
          </div>
        </div>

        {/* Additional Info Section */}
        {listing.url && (
          <div className="space-y-2">
            <h2 className="font-semibold text-gray-700 flex items-center gap-2">
              <span>🔗</span> Additional Information
            </h2>
            <div className="bg-blue-50 rounded-lg p-4">
              <a
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-sm text-blue-600 hover:text-blue-700 break-all"
              >
                {listing.url}
              </a>
            </div>
          </div>
        )}
      </div>

      {listing.images && listing.images.length > 0 && (
        <div className="mb-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {listing.images.map((url, index) => (
              <img
                key={index}
                src={url}
                alt={`${listing.title} - Image ${index + 1}`}
                className="w-full h-64 object-cover rounded-lg"
              />
            ))}
          </div>
        </div>
      )}

      <div className="flex gap-2 mt-4">
        <button
          onClick={() => setShowEditModal(true)}
          className="flex-1 bg-green-500 text-white py-2 px-4 rounded
                    hover:bg-green-600 transition-colors text-sm font-medium
                    flex items-center justify-center gap-1"
        >
          <span>✏️</span>
          <span>Edit Listing</span>
        </button>
        
        {/* Other action buttons */}
      </div>

      {showEditModal && (
        <EditListing
          item={listing}
          onClose={() => setShowEditModal(false)}
          onSave={() => {
            // Refresh the listing data
            fetchItem();
            setShowEditModal(false);
          }}
        />
      )}
    </div>
  )
} 