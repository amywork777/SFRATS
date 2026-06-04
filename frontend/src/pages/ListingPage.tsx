import { useCallback, useEffect, useState } from 'react'
import { useParams, useNavigate, Link } from 'react-router-dom'
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

  const fetchListing = useCallback(async () => {
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
  }, [id])

  useEffect(() => { fetchListing() }, [fetchListing])

  if (loading) return (
    <div className="max-w-3xl mx-auto p-8 pt-24">
      <div className="animate-pulse space-y-4">
        <div className="h-3 bg-paper-dark w-32" />
        <div className="h-12 bg-paper-dark w-3/4" />
        <div className="h-1 bg-ink/30 w-full" />
        <div className="h-32 bg-paper-dark" />
        <div className="h-64 bg-paper-dark" />
      </div>
    </div>
  )

  if (error) return (
    <div className="max-w-3xl mx-auto p-8 pt-24">
      <div className="border-2 border-bridge-700 bg-bridge-50 p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bridge-700 mb-1">Error</div>
        <div className="font-display text-[18px] text-ink">{error}</div>
      </div>
      <button
        onClick={() => navigate('/')}
        className="mt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-ink hover:text-bridge-600 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Back to map
      </button>
    </div>
  )

  if (!listing) return (
    <div className="max-w-3xl mx-auto p-8 pt-24">
      <div className="font-display text-[18px] text-ink-mute">Listing not found.</div>
      <button
        onClick={() => navigate('/')}
        className="mt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-ink hover:text-bridge-600 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Back to map
      </button>
    </div>
  )

  return (
    <div className="pt-20">
      <div className="max-w-3xl mx-auto px-4 md:px-8 mb-2 flex justify-between items-center">
        <button
          onClick={() => navigate('/')}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:text-bridge-600 inline-flex items-center gap-2"
        >
          <span aria-hidden>←</span> Back to map
        </button>
        <Link
          to={`/listing/${id}/manage`}
          className="font-mono text-[11px] uppercase tracking-[0.14em] text-ink hover:text-bridge-600"
        >
          Manage ↗
        </Link>
      </div>

      <Listing listing={listing} onRefresh={fetchListing} />
    </div>
  )
}
