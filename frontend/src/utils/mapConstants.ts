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