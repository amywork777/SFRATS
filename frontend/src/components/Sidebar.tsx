import React, { useState } from 'react'
import { categoryEmojis } from './Legend'
import DateFilter from './Sidebar/DateFilter'

interface SidebarProps {
  onFiltersChange: (filters: any) => void
}

function Sidebar({ onFiltersChange }: SidebarProps) {
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

  return (
    <div className="w-80 h-full bg-white shadow-lg fixed left-0 top-16 p-6 overflow-y-auto">
      {/* Search Input */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search free stuff..."
          className="w-full px-4 py-2 border rounded-lg"
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
      <div className="mt-8">
        <div className="flex justify-between items-center mb-3">
          <h3 className="text-lg font-semibold">Categories</h3>
          {filters.categories.length > 0 && (
            <button
              onClick={() => {
                const newFilters = { ...filters, categories: [] }
                setFilters(newFilters)
                onFiltersChange(newFilters)
              }}
              className="text-blue-500 text-sm hover:underline"
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
  )
}

export default Sidebar
