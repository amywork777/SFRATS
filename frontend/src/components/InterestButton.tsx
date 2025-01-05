import { useState } from 'react'
import { api } from '../services/api'

interface InterestButtonProps {
  itemId: number
  initialCount: number
}

export default function InterestButton({ itemId, initialCount }: InterestButtonProps) {
  const [interestCount, setInterestCount] = useState(initialCount)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [hasInteracted, setHasInteracted] = useState(false)

  const handleInterestClick = async () => {
    if (hasInteracted) return
    setLoading(true)
    setError(null)

    try {
      await api.updateInterestCount(itemId.toString())
      setInterestCount(prev => prev + 1)
      setHasInteracted(true)
    } catch (err) {
      console.error('Error updating interest:', err)
      setError(err instanceof Error ? err.message : 'Failed to update interest')
    } finally {
      setLoading(false)
    }
  }

  return (
    <button
      onClick={handleInterestClick}
      disabled={loading || hasInteracted}
      className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-colors
        ${hasInteracted 
          ? 'bg-blue-100 text-blue-700' 
          : 'bg-gray-100 hover:bg-gray-200 text-gray-700'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={hasInteracted ? 'Already expressed interest' : 'Express interest'}
    >
      <span className="text-lg">👋</span>
      <span className="text-sm font-medium">
        {interestCount} {interestCount === 1 ? 'person' : 'people'} interested
      </span>
      {error && (
        <span className="text-xs text-red-500 ml-2">{error}</span>
      )}
    </button>
  )
} 