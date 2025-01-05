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
        if (!id || !urlEditCode) {
          throw new Error('Invalid edit URL')
        }

        // First verify the edit code
        await api.verifyEditCode(id, urlEditCode)

        // Then fetch the listing
        const data = await api.getItem(id)

        // Format the data for the form
        const formattedData = {
          ...data,
          edit_code: urlEditCode
        }

        console.log('Formatted listing data:', formattedData)
        setListing(formattedData)
        setError(null)
      } catch (err) {
        console.error('Error:', err)
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
        onClick={() => navigate(`/listing/${id}`)}
        className="mt-4 text-blue-500 hover:underline flex items-center gap-2"
      >
        ← Back to Listing
      </button>
    </div>
  )

  if (!listing) return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="text-gray-600">Listing not found</div>
      <button
        onClick={() => navigate(`/listing/${id}`)}
        className="mt-4 text-blue-500 hover:underline flex items-center gap-2"
      >
        ← Back to Listing
      </button>
    </div>
  )

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
      <SubmitForm 
        initialData={listing}
        editMode={true}
        editCode={urlEditCode}
        onClose={() => navigate(`/listing/${id}`)}
      />
    </div>
  )
}

export default EditPage 