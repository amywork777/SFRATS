import { useState } from 'react'

interface InterestButtonProps {
  itemId: number
  initialCount?: number
}

function InterestButton({ itemId, initialCount = 0 }: InterestButtonProps) {
  const [count, setCount] = useState(initialCount)
  const [hasLiked, setHasLiked] = useState(false)

  const handleClick = async () => {
    try {
      const response = await fetch(`http://localhost:3001/api/items/${itemId}/interest`, {
        method: 'POST'
      })
      
      if (!response.ok) throw new Error('Failed to update interest')
      
      setCount(prev => prev + (hasLiked ? -1 : 1))
      setHasLiked(!hasLiked)
    } catch (error) {
      console.error('Error updating interest:', error)
    }
  }

  return (
    <button
      onClick={handleClick}
      className={`flex items-center space-x-1 px-3 py-1 rounded-full text-sm ${
        hasLiked 
          ? 'bg-blue-100 text-blue-600' 
          : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
      }`}
    >
      <span>👋</span>
      <span>{count}</span>
    </button>
  )
}

export default InterestButton 