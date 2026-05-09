import { useState } from 'react'
import { Hand } from 'lucide-react'
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
      className={`inline-flex items-center gap-2 px-3 py-1.5 border border-ink font-mono text-[11px] uppercase tracking-[0.12em] font-semibold transition-colors
        ${hasInteracted
          ? 'bg-bridge-500 text-paper-light cursor-default'
          : 'bg-paper-light text-ink hover:bg-paper'
        }
        ${loading ? 'opacity-50 cursor-not-allowed' : ''}
      `}
      title={hasInteracted ? 'Already expressed interest' : 'Express interest'}
    >
      <Hand size={13} strokeWidth={2.2} />
      <span>
        {interestCount} {interestCount === 1 ? 'person' : 'people'}
      </span>
      {error && (
        <span className="ml-2 text-[10px] text-bridge-700 normal-case tracking-normal">{error}</span>
      )}
    </button>
  )
}
