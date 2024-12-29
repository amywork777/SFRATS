import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SubmitForm from '../components/SubmitForm'
import { FreeItem } from '../types'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function EditPage() {
  const { id, editCode: urlEditCode } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState<FreeItem | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!id || !urlEditCode) {
      setError('Invalid edit URL')
      setLoading(false)
      return
    }

    // First verify the edit code
    fetch(`${API_URL}/api/items/${id}/verify-edit-code`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Edit-Code': urlEditCode
      }
    })
    .then(res => {
      if (!res.ok) throw new Error('Invalid edit code')
      return fetch(`${API_URL}/api/items/${id}`)
    })
    .then(res => {
      if (!res.ok) throw new Error('Failed to fetch listing')
      return res.json()
    })
    .then(data => {
      // Format dates properly for the form
      const formattedData = {
        ...data,
        id: parseInt(id),
        edit_code: urlEditCode,
        // Use the original dates from the database
        available_from: data.available_from ? new Date(data.available_from) : null,
        available_until: data.available_until ? new Date(data.available_until) : null,
        location_address: data.location_address || '',
        location_lat: parseFloat(data.location_lat) || null,
        location_lng: parseFloat(data.location_lng) || null
      }
      console.log('Formatted listing data:', formattedData)
      setListing(formattedData)
      setLoading(false)
    })
    .catch(err => {
      console.error('Error:', err)
      setError(err.message)
      setLoading(false)
      if (err.message === 'Invalid edit code') {
        setTimeout(() => navigate(`/listing/${id}`), 2000)
      }
    })
  }, [id, urlEditCode, navigate])

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return (
    <div className="max-w-4xl mx-auto p-4">
      <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
        <div className="text-red-700 font-medium mb-2">Error</div>
        <div className="text-red-600">{error}</div>
      </div>
      <button
        onClick={() => navigate(`/listing/${id}`)}
        className="text-blue-500 hover:underline flex items-center gap-2"
      >
        ← Back to Listing
      </button>
    </div>
  )
  if (!listing) return <div className="p-4">Listing not found</div>

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