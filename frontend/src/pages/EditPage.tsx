import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SubmitForm from '../components/SubmitForm'
import { DbItem } from '../types/supabase'
import { api } from '../services/api'

function EditPage() {
  const { id, editCode: urlEditCode } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState<DbItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchListing = async () => {
      try {
        if (!id || !urlEditCode) throw new Error('Invalid edit URL')
        await api.verifyEditCode(id, urlEditCode)
        const data = await api.getItem(id)
        setListing({ ...data, edit_code: urlEditCode } as DbItem)
        setError(null)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load listing')
        if (err instanceof Error && err.message === 'Invalid edit code') {
          setTimeout(() => navigate(`/listing/${id}`), 2000)
        }
      } finally {
        setLoading(false)
      }
    }
    fetchListing()
  }, [id, urlEditCode, navigate])

  if (loading) return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24">
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
    <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24">
      <div className="border-2 border-bridge-700 bg-bridge-50 p-5">
        <div className="font-mono text-[10px] uppercase tracking-[0.16em] text-bridge-700 mb-1">Error</div>
        <div className="font-display text-[18px] text-ink">{error}</div>
      </div>
      <button
        onClick={() => navigate(`/listing/${id}`)}
        className="mt-6 font-mono text-[12px] uppercase tracking-[0.14em] text-ink hover:text-bridge-600 inline-flex items-center gap-2"
      >
        <span aria-hidden>←</span> Back to listing
      </button>
    </div>
  )

  if (!listing) return (
    <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24">
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
    <div className="max-w-3xl mx-auto px-4 md:px-8 pt-24 pb-16">
      <div className="mb-8">
        <span className="label">Editing · № {String(listing.id).padStart(4, '0')}</span>
        <h1 className="font-display font-black text-5xl md:text-6xl text-ink leading-[0.95] mt-3 tracking-tight">
          Edit listing<span className="serif-wonk text-bridge-500 italic font-normal">.</span>
        </h1>
        <div className="rule-thick mt-6" />
      </div>
      <SubmitForm
        initialData={listing}
        editMode
        editCode={urlEditCode}
        onClose={() => navigate(`/listing/${id}`)}
      />
    </div>
  )
}

export default EditPage
