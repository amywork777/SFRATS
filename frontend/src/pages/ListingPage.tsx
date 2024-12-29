import { useParams, useNavigate } from 'react-router-dom'
import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import DirectionsButton from '../components/DirectionsButton'
import { createMarkerIcon } from '../utils/mapUtils'
import { FreeItem } from '../types'
import { categoryEmojis, statusColors } from '../components/Legend'

interface ListingPageProps {
  // ... existing props
}

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

const getStatusColors = (status: string | undefined) => {
  if (!status || !statusColors[status as keyof typeof statusColors]) {
    return statusColors['available'] // Default to available if status is invalid
  }
  return statusColors[status as keyof typeof statusColors]
}

function ListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState<FreeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [showEditCode, setShowEditCode] = useState(false)
  const [editCode, setEditCode] = useState('')
  const [statusUpdateError, setStatusUpdateError] = useState('')

  useEffect(() => {
    fetch(`http://localhost:3001/api/items/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Item not found')
        return res.json()
      })
      .then(data => {
        // Parse numeric values
        setListing({
          ...data,
          location_lat: parseFloat(data.location_lat),
          location_lng: parseFloat(data.location_lng),
          available_from: new Date(data.available_from),
          available_until: data.available_until ? new Date(data.available_until) : null
        })
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching listing:', err)
        setError(err.message)
        setLoading(false)
      })
  }, [id])

  const handleShare = async () => {
    const url = window.location.href
    await navigator.clipboard.writeText(url)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const verifyEditCode = async (code: string) => {
    try {
      console.log('Verifying edit code:', code)
      
      const response = await fetch(`${API_URL}/api/items/validate-edit-code`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          itemId: id,
          editCode: code
        })
      })

      const data = await response.json()
      console.log('Verification response:', data)

      return data.valid
    } catch (err) {
      console.error('Edit code verification error:', err)
      return false
    }
  }

  const handleStatusUpdate = async (newStatus: string) => {
    if (!editCode) {
      setStatusUpdateError('Please enter your edit code')
      return
    }

    try {
      console.log('Updating status:', { id, newStatus, editCode })

      const response = await fetch(`${API_URL}/api/items/${id}/status`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          status: newStatus,
          editCode
        })
      })

      const data = await response.json()
      console.log('Status update response:', data)

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to update status')
      }

      // Update the listing in state
      setListing(prev => {
        if (!prev) return null
        return {
          ...prev,
          status: newStatus
        }
      })
      
      setShowEditCode(false)
      setEditCode('')
      setStatusUpdateError('')
    } catch (err) {
      console.error('Status update error:', err)
      setStatusUpdateError(err instanceof Error ? err.message : 'Failed to update status')
    }
  }

  const handleDelete = async () => {
    if (!editCode) {
      setStatusUpdateError('Please enter your edit code')
      return
    }

    if (!window.confirm('Are you sure you want to delete this listing?')) {
      return
    }

    try {
      console.log('Sending delete request:', {
        id,
        editCode
      })

      const response = await fetch(`${API_URL}/api/items/${id}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ editCode })
      })

      const data = await response.json()
      console.log('Delete response:', data)

      if (!response.ok) {
        throw new Error(data.error || data.details || 'Failed to delete item')
      }

      navigate('/')
    } catch (err) {
      console.error('Delete error:', err)
      setStatusUpdateError(err instanceof Error ? err.message : 'Failed to delete item')
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center min-h-screen">
      <div className="text-lg">Loading...</div>
    </div>
  )

  if (error || !listing) return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <div className="text-lg text-red-500 mb-4">
        {error || 'Listing not found'}
      </div>
      <button
        onClick={() => navigate('/')}
        className="text-blue-500 hover:underline"
      >
        ← Back to Home
      </button>
    </div>
  )

  return (
    <div className="min-h-screen pb-8">
      <div className="max-w-4xl mx-auto px-4 pt-8">
        {/* Back Button */}
        <button
          onClick={() => navigate('/')}
          className="mb-6 text-blue-500 hover:underline flex items-center gap-2"
        >
          ← Back to Map
        </button>

        {/* Header Section - Always shown */}
        <div className="mb-8">
          <div className="flex items-start justify-between">
            <div>
              <h1 className="text-3xl font-bold mb-2">{listing.title}</h1>
              <div className="flex items-center gap-3 text-gray-600">
                <span className="flex items-center gap-1">
                  {categoryEmojis[listing.category as keyof typeof categoryEmojis]} {listing.category}
                </span>
                <span>•</span>
                <span>Posted {format(new Date(listing.created_at), 'PPP')}</span>
                <span>•</span>
                <span>By {listing.posted_by || 'Anonymous'}</span>
                <span>•</span>
                <span className={`px-2 py-1 rounded-full text-sm font-medium
                  ${getStatusColors(listing.status).bg}
                  ${getStatusColors(listing.status).text}`}
                >
                  {getStatusColors(listing.status).label}
                </span>
              </div>
            </div>
            <button
              onClick={handleShare}
              className="flex items-center gap-2 bg-gray-100 text-gray-700 
                        py-2 px-4 rounded hover:bg-gray-200 transition-colors"
            >
              {copied ? '✓ Copied!' : '🔗 Share'}
            </button>
          </div>
        </div>

        {/* Map Section - Always shown if coordinates exist */}
        {listing.location_lat && listing.location_lng && (
          <div className="h-[400px] mb-8 rounded-lg overflow-hidden shadow-lg">
            <MapContainer
              center={[listing.location_lat, listing.location_lng]}
              zoom={15}
              style={{ height: '100%', width: '100%' }}
            >
              <TileLayer
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
              />
              <Marker
                position={[listing.location_lat, listing.location_lng]}
                icon={createMarkerIcon(listing.category, listing.status)}
              />
            </MapContainer>
          </div>
        )}

        {/* Main Content Section */}
        <div className="bg-white rounded-lg shadow-lg p-6 mb-8 space-y-6">
          {/* Description - Always shown */}
          <div className="prose max-w-none">
            <h2 className="text-xl font-semibold mb-4">Description</h2>
            <p className="text-gray-600 whitespace-pre-wrap">{listing.description}</p>
          </div>
          
          {/* Location - Only if address exists */}
          {listing.location_address && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Location</h2>
              <p className="text-gray-600 mb-4">{listing.location_address}</p>
              {listing.location_lat && listing.location_lng && (
                <div className="flex gap-4">
                  <DirectionsButton
                    lat={listing.location_lat}
                    lng={listing.location_lng}
                    address={listing.location_address}
                    variant="prominent"
                  />
                </div>
              )}
            </div>
          )}

          {/* Time Details - Always shown */}
          <div>
            <h2 className="text-xl font-semibold mb-2">Time & Availability</h2>
            <div className="space-y-2 text-gray-600">
              <p>Available from: {format(listing.available_from, 'PPP')}</p>
              {listing.available_until && (
                <p>Available until: {format(listing.available_until, 'PPP')}</p>
              )}
              {listing.time_details && (
                <p>
                  <span className="font-medium">Additional Time Details:</span>
                  <br />
                  {listing.time_details}
                </p>
              )}
            </div>
          </div>

          {/* Contact Info - Only if exists */}
          {listing.contact_info && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Contact Information</h2>
              <p className="text-gray-600 whitespace-pre-wrap">{listing.contact_info}</p>
            </div>
          )}

          {/* Source/URL - Only if exists */}
          {listing.url && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Source</h2>
              <a 
                href={listing.url}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-500 hover:underline break-all"
              >
                {listing.url}
              </a>
            </div>
          )}

          {/* Categories/Tags - Only if exist */}
          {listing.categories && listing.categories.length > 0 && (
            <div>
              <h2 className="text-xl font-semibold mb-2">Tags</h2>
              <div className="flex flex-wrap gap-2">
                {listing.categories.map((tag, index) => (
                  <span 
                    key={index}
                    className="bg-gray-100 text-gray-700 px-3 py-1 rounded-full text-sm"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Comments section placeholder - Coming soon */}
        <div className="bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Comments</h2>
          <p className="text-gray-600">Comments feature coming soon!</p>
        </div>

        {/* Status Controls */}
        <div className="bg-gray-50 rounded-lg p-6 mt-8">
          <h2 className="text-xl font-semibold mb-4">Update Listing</h2>
          
          {!showEditCode ? (
            <button
              onClick={() => setShowEditCode(true)}
              className="text-blue-500 hover:text-blue-600"
            >
              I have an edit code
            </button>
          ) : (
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enter Edit Code
                </label>
                <input
                  type="text"
                  value={editCode}
                  onChange={(e) => setEditCode(e.target.value)}
                  className="w-full px-3 py-2 border rounded-md"
                  placeholder="Enter your edit code"
                />
              </div>

              {statusUpdateError && (
                <div className="text-red-500 text-sm">{statusUpdateError}</div>
              )}

              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleStatusUpdate('available')}
                  className={`px-4 py-2 rounded-md ${
                    listing.status === 'available' 
                      ? 'bg-green-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Mark Available
                </button>
                <button
                  onClick={() => handleStatusUpdate('gone')}
                  className={`px-4 py-2 rounded-md ${
                    listing.status === 'gone' 
                      ? 'bg-gray-500 text-white' 
                      : 'bg-gray-100 hover:bg-gray-200'
                  }`}
                >
                  Mark as Gone
                </button>
                <button
                  onClick={() => {
                    if (!editCode) {
                      setStatusUpdateError('Please enter your edit code')
                      return
                    }
                    // Store in sessionStorage instead of localStorage
                    sessionStorage.setItem(`editCode_${listing.id}`, editCode)
                    // Also store timestamp to handle cleanup
                    sessionStorage.setItem(`editCodeTimestamp_${listing.id}`, Date.now().toString())
                    navigate(`/edit/${listing.id}`)
                  }}
                  className="px-4 py-2 bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200"
                >
                  Edit Listing
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-100 text-red-700 rounded-md hover:bg-red-200"
                >
                  Delete Listing
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default ListingPage 