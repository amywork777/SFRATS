import { useState } from 'react'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface MobileNavProps {
  onFiltersChange: (filters: any) => void
}

export default function MobileNav({ onFiltersChange }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<string>('all')
  
  const categories = ['Items', 'Food', 'Events', 'Services']
  const categoryEmojis = {
    'Items': '📦',
    'Food': '🍕',
    'Events': '🎉',
    'Services': '🔧'
  }

  const timeRanges = [
    { id: 'all', label: 'All Time' },
    { id: 'today', label: 'Today' },
    { id: 'week', label: 'This Week' },
    { id: 'month', label: 'This Month' }
  ]

  const toggleCategory = (category: string) => {
    const newCategories = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    setSelectedCategories(newCategories)
    onFiltersChange({ categories: newCategories })
  }

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
    let start = null
    let end = null
    const now = new Date()

    switch (range) {
      case 'today':
        start = now
        break
      case 'week':
        start = now
        end = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000)
        break
      case 'month':
        start = now
        end = new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000)
        break
    }

    onFiltersChange({ dates: { start, end } })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[2000] md:hidden bg-blue-500 text-white p-3 rounded-full shadow-lg"
      >
        <FunnelIcon className="h-5 w-5" />
      </button>

      <div className={`
        fixed inset-0 z-[2000] md:hidden transform transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div 
          className="absolute inset-0 bg-black/50" 
          onClick={() => setIsOpen(false)} 
        />

        <div className="absolute inset-x-0 bottom-0 bg-white rounded-t-xl max-h-[80vh] overflow-y-auto">
          <div className="sticky top-0 bg-white border-b px-3 py-2 flex justify-between items-center">
            <h2 className="text-base font-medium">Filter Listings</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategories([])
                  setTimeRange('all')
                  onFiltersChange({ 
                    search: '',
                    categories: [],
                    dates: { start: null, end: null }
                  })
                }}
                className="text-xs text-gray-500 hover:text-gray-700 px-2 py-1"
              >
                Clear
              </button>
              <button 
                onClick={() => setIsOpen(false)}
                className="p-1 hover:bg-gray-100 rounded-full"
              >
                <XMarkIcon className="h-4 w-4 text-gray-500" />
              </button>
            </div>
          </div>

          <div className="p-4 space-y-6">
            {/* Search */}
            <div>
              <h3 className="text-sm font-medium mb-2">Search</h3>
              <input
                type="text"
                placeholder="Search listings..."
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="w-full px-3 py-2 border rounded-lg text-sm"
              />
            </div>

            {/* Categories with Checkmarks */}
            <div>
              <h3 className="text-sm font-medium mb-2">Categories</h3>
              <div className="grid grid-cols-2 gap-2">
                {categories.map(category => (
                  <button
                    key={category}
                    onClick={() => toggleCategory(category)}
                    className={`flex items-center justify-between px-3 py-2 rounded-lg border
                      ${selectedCategories.includes(category)
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 bg-white'
                      } transition-colors`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{categoryEmojis[category]}</span>
                      <span className="text-sm">{category}</span>
                    </div>
                    {selectedCategories.includes(category) && (
                      <span className="text-blue-500">✓</span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Time Range */}
            <div>
              <h3 className="text-sm font-medium mb-2">Time Range</h3>
              <div className="space-y-3">
                {/* Quick select buttons */}
                <div className="grid grid-cols-2 gap-2">
                  {timeRanges.map(range => (
                    <button
                      key={range.id}
                      onClick={() => handleTimeRangeChange(range.id)}
                      className={`px-3 py-2 rounded-lg border text-sm
                        ${timeRange === range.id
                          ? 'border-blue-500 bg-blue-50 text-blue-500'
                          : 'border-gray-200 bg-white'
                        } transition-colors`}
                    >
                      {range.label}
                    </button>
                  ))}
                </div>

                {/* Custom date inputs */}
                <div className="pt-2 border-t">
                  <div className="text-xs text-gray-500 mb-2">Custom Range</div>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">From</label>
                      <input
                        type="date"
                        onChange={(e) => {
                          setTimeRange('custom')
                          onFiltersChange({ 
                            dates: { 
                              start: new Date(e.target.value),
                              end: dateRange?.end 
                            }
                          })
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                    <div className="flex-1">
                      <label className="text-xs text-gray-500 mb-1 block">To</label>
                      <input
                        type="date"
                        onChange={(e) => {
                          setTimeRange('custom')
                          onFiltersChange({ 
                            dates: { 
                              start: dateRange?.start,
                              end: new Date(e.target.value)
                            }
                          })
                        }}
                        className="w-full px-3 py-2 border rounded-lg text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Done Button */}
            <div className="pt-2 border-t">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-gray-100 text-gray-600 rounded-lg text-sm font-medium hover:bg-gray-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
} 