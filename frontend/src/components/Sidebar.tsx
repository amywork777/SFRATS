import React, { useState } from 'react'
import { categoryEmojis } from './Legend'
import DateFilter from './Sidebar/DateFilter'

interface SidebarProps {
  onFiltersChange: (filters: any) => void
  isMobile?: boolean
}

function Sidebar({ onFiltersChange, isMobile = false }: SidebarProps) {
  const [filters, setFilters] = useState({
    search: '',
    dates: { start: null, end: null },
    categories: [] as string[]
  })

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]

    const newFilters = {
      ...filters,
      categories: newCategories
    }
    setFilters(newFilters)
    onFiltersChange(newFilters)
  }

  const baseStyles = isMobile 
    ? "w-full text-sm"
    : "w-80 h-full bg-white shadow-lg fixed left-0 top-16 hidden md:block"

  return (
    <div className={`${baseStyles} overflow-y-auto`}>
      <div className={`${isMobile ? 'p-3' : 'p-6'}`}>
        {/* Search Input */}
        <div className="mb-4">
          <input
            type="text"
            placeholder="Search free stuff..."
            className="w-full px-3 py-2 border rounded-lg text-sm"
            value={filters.search}
            onChange={(e) => {
              const newFilters = { ...filters, search: e.target.value }
              setFilters(newFilters)
              onFiltersChange(newFilters)
            }}
          />
        </div>

        {/* Date Filter */}
        <div className="mb-6">
          <DateFilter
            onChange={(dates) => {
              const newFilters = { ...filters, dates }
              setFilters(newFilters)
              onFiltersChange(newFilters)
            }}
          />
        </div>

        {/* Category Filters */}
        <div className={`mt-4 ${isMobile ? 'space-y-1' : 'space-y-2'}`}>
          <div className="flex justify-between items-center mb-2">
            <h3 className={`${isMobile ? 'text-sm' : 'text-lg'} font-semibold`}>Categories</h3>
            {filters.categories.length > 0 && (
              <button
                onClick={() => {
                  const newFilters = { ...filters, categories: [] }
                  setFilters(newFilters)
                  onFiltersChange(newFilters)
                }}
                className="text-blue-500 text-xs hover:underline"
              >
                Clear all
              </button>
            )}
          </div>
          <div className="space-y-2">
            {Object.entries(categoryEmojis).map(([category, emoji]) => (
              <label
                key={category}
                className="flex items-center gap-2 cursor-pointer hover:bg-gray-50 p-2 rounded-lg"
              >
                <input
                  type="checkbox"
                  checked={filters.categories.includes(category)}
                  onChange={() => handleCategoryToggle(category)}
                  className="rounded text-blue-500 focus:ring-blue-500"
                />
                <span className="text-xl">{emoji}</span>
                <span>{category}</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default Sidebar
