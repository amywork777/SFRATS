import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import SubmitForm from '../components/SubmitForm'

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function EditPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [listing, setListing] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editCode, setEditCode] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setError('No listing ID provided')
      setLoading(false)
      return
    }

    // Get the edit code from sessionStorage
    const storedEditCode = sessionStorage.getItem(`editCode_${id}`)
    const timestamp = sessionStorage.getItem(`editCodeTimestamp_${id}`)
    
    console.log('Retrieved edit code:', { id, storedEditCode, timestamp })

    // Check if edit code exists and is not expired (30 minutes)
    if (!storedEditCode || !timestamp || 
        Date.now() - parseInt(timestamp) > 30 * 60 * 1000) {
      setError('Edit code expired or not provided')
      setLoading(false)
      return
    }

    setEditCode(storedEditCode)

    // Fetch the listing data
    fetch(`${API_URL}/api/items/${id}`)
      .then(res => {
        if (!res.ok) throw new Error('Failed to fetch listing')
        return res.json()
      })
      .then(data => {
        console.log('Fetched listing:', data)
        setListing(data)
        setLoading(false)
      })
      .catch(err => {
        console.error('Error fetching listing:', err)
        setError(err.message)
        setLoading(false)
      })

    // Cleanup function
    return () => {
      // Only clear if more than 5 seconds have passed since storing
      const currentTimestamp = parseInt(sessionStorage.getItem(`editCodeTimestamp_${id}`) || '0')
      if (Date.now() - currentTimestamp > 5000) {
        sessionStorage.removeItem(`editCode_${id}`)
        sessionStorage.removeItem(`editCodeTimestamp_${id}`)
      }
    }
  }, [id])

  // Add cleanup on successful edit
  const handleClose = () => {
    sessionStorage.removeItem(`editCode_${id}`)
    sessionStorage.removeItem(`editCodeTimestamp_${id}`)
    navigate(`/listing/${id}`)
  }

  if (loading) return <div className="p-4">Loading...</div>
  if (error) return (
    <div className="p-4">
      <div className="text-red-500 mb-4">Error: {error}</div>
      <button
        onClick={() => navigate(`/listing/${id}`)}
        className="text-blue-500 hover:underline"
      >
        ← Back to Listing
      </button>
    </div>
  )
  if (!listing || !editCode) return <div className="p-4">Listing not found</div>

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Edit Listing</h1>
      <SubmitForm 
        initialData={listing}
        editMode={true}
        editCode={editCode}
        onClose={handleClose}
      />
    </div>
  )
}

export default EditPage 