export const categoryEmojis = {
  Events: '🎉',
  Food: '🍕',
  Items: '📦',
  Services: '🔧'
} as const

export const statusColors = {
  available: {
    bg: 'bg-green-100',
    text: 'text-green-800',
    label: 'Available'
  },
  gone: {
    bg: 'bg-gray-100',
    text: 'text-gray-800',
    label: 'Gone'
  }
} as const

function Legend() {
  return (
    <div className="absolute bottom-4 right-4 bg-white p-4 rounded-lg shadow-lg">
      <h3 className="font-semibold mb-2">Categories</h3>
      <div className="space-y-2">
        {Object.entries(categoryEmojis).map(([category, emoji]) => (
          <div key={category} className="flex items-center gap-2">
            <span>{emoji}</span>
            <span>{category}</span>
          </div>
        ))}
      </div>

      <h3 className="font-semibold mt-4 mb-2">Status</h3>
      <div className="space-y-2">
        {Object.entries(statusColors).map(([status, color]) => (
          <div key={status} className="flex items-center gap-2">
            <div className={`w-3 h-3 rounded-full ${color}`}></div>
            <span className="capitalize">{status}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export default Legend 