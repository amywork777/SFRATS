import { useState, useEffect } from 'react'
import { FreeItem } from '../types'
import { format } from 'date-fns'
import ListingPreview from './ListingPreview'
import { categoryEmojis } from './Legend'

function SubmissionsList() {
  const [submissions, setSubmissions] = useState<FreeItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchSubmissions = async () => {
      try {
        const response = await fetch('http://localhost:3001/api/items')
        if (!response.ok) {
          throw new Error('Failed to fetch submissions')
        }
        const data = await response.json()
        
        if (data.error) {
          throw new Error(data.error)
        }

        setSubmissions(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load submissions')
      } finally {
        setLoading(false)
      }
    }

    fetchSubmissions()
  }, [])

  const openInGoogleMaps = (lat: number, lng: number) => {
    const mapsUrl = `https://www.google.com/maps?q=${lat},${lng}`
    window.open(mapsUrl, '_blank')
  }

  if (loading) return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white shadow-lg overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
        <div className="text-gray-500">Loading submissions...</div>
      </div>
    </div>
  )

  if (error) return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white shadow-lg overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
        <div className="text-red-500">Error: {error}</div>
      </div>
    </div>
  )

  return (
    <div className="fixed right-0 top-16 h-[calc(100vh-4rem)] w-96 bg-white shadow-lg overflow-y-auto">
      <div className="p-4">
        <h2 className="text-xl font-bold mb-4">Recent Submissions</h2>
        <div className="space-y-4">
          {submissions.length === 0 ? (
            <p className="text-gray-500">No submissions yet</p>
          ) : (
            submissions.map(item => (
              <div key={item.id} className="border rounded-lg p-4 bg-white shadow-sm">
                <ListingPreview 
                  {...item} 
                  showDirections={false}
                  showCategory={false}
                  showTimestamp={false}
                />
                <div className="flex items-center justify-between text-xs mt-2">
                  <div className="flex items-center gap-1 text-gray-500">
                    <span>{categoryEmojis[item.category as keyof typeof categoryEmojis] || '📍'}</span>
                    <span>{item.category}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-400">
                      Posted: {format(new Date(item.created_at), 'MMM d')}
                    </span>
                    {item.location_lat && item.location_lng && (
                      <button
                        onClick={() => openInGoogleMaps(item.location_lat!, item.location_lng!)}
                        className="text-blue-500 hover:text-blue-600"
                      >
                        🗺️ Maps
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default SubmissionsList 