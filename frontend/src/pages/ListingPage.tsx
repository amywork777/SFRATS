import { useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
import { MapContainer, TileLayer, Marker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import Listing from '../components/Listing'
import { DbItem } from '../types/supabase'
import { api } from '../services/api'

export default function ListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState<DbItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchListing = async () => {
    try {
      if (!id) throw new Error('No listing ID provided')
      const data = await api.getItem(id)
      setListing(data)
      setError(null)
    } catch (err) {
      console.error('Error fetching listing:', err)
      setError(err instanceof Error ? err.message : 'Failed to load listing')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListing()
  }, [id])

  if (loading) return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="animate-pulse">
        <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
        <div className="h-4 bg-gray-200 rounded w-1/4 mb-6"></div>
        <div className="h-32 bg-gray-200 rounded mb-6"></div>
        <div className="h-64 bg-gray-200 rounded"></div>
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4">
        <div className="text-red-700 font-medium mb-2">Error</div>
        <div className="text-red-600">{error}</div>
      </div>
      <button
        onClick={() => navigate('/')}
        className="mt-4 text-blue-500 hover:underline flex items-center gap-2"
      >
        ← Back to Map
      </button>
    </div>
  )

  if (!listing) return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-gray-600">Listing not found</div>
      <button
        onClick={() => navigate('/')}
        className="mt-4 text-blue-500 hover:underline flex items-center gap-2"
      >
        ← Back to Map
      </button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="mb-4 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="text-blue-500 hover:underline flex items-center gap-2"
        >
          ← Back to Map
        </button>
        <Link
          to={`/listing/${id}/manage`}
          className="text-blue-500 hover:underline"
        >
          Manage Listing
        </Link>
      </div>

      <Listing 
        listing={listing} 
        onRefresh={fetchListing}
      />
    </div>
  )
} 