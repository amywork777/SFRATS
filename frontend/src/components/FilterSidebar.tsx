import { ChangeEvent } from 'react'

interface FilterSidebarProps {
  dateRange: {
    start: string
    end: string
  }
  onDateChange: (start: string, end: string) => void
  selectedCategory: string
  onCategoryChange: (category: string) => void
  isLoading: boolean
  resultCount: number
}

const categories = [
  'All',
  'Items',
  'Food',
  'Events',
  'Services',
]

const FilterSidebar = ({
  dateRange,
  onDateChange,
  selectedCategory,
  onCategoryChange,
  isLoading,
  resultCount
}: FilterSidebarProps) => {
  const handleStartDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    onDateChange(e.target.value, dateRange.end)
  }

  const handleEndDateChange = (e: ChangeEvent<HTMLInputElement>) => {
    onDateChange(dateRange.start, e.target.value)
  }

  return (
    <div className="w-80 bg-white shadow-lg h-screen overflow-y-auto p-4">
      <h1 className="text-xl font-bold mb-6">SF Free Stuff</h1>
      
      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Category</h2>
        <select
          value={selectedCategory}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="w-full px-3 py-2 border rounded-md"
        >
          {categories.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>

      <div className="mb-6">
        <h2 className="text-lg font-semibold mb-2">Available During</h2>
        <div className="space-y-2">
          <input
            type="month"
            value={dateRange.start}
            onChange={handleStartDateChange}
            className="w-full px-3 py-2 border rounded-md"
          />
        </div>
      </div>

      <div className="mt-4 text-sm text-gray-600">
        {isLoading ? (
          'Loading...'
        ) : (
          `Found ${resultCount} item${resultCount !== 1 ? 's' : ''}`
        )}
      </div>
    </div>
  )
}

export default FilterSidebar 