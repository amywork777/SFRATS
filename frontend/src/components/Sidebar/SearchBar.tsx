import { useState, useCallback } from 'react'
import debounce from 'lodash/debounce'

interface SearchBarProps {
  onSearch: (query: string) => void
}

function SearchBar({ onSearch }: SearchBarProps) {
  const [query, setQuery] = useState('')

  // Debounce the search callback
  const debouncedSearch = useCallback(
    debounce((searchQuery: string) => {
      onSearch(searchQuery)
    }, 300),
    [onSearch]
  )

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newQuery = e.target.value
    setQuery(newQuery)
    debouncedSearch(newQuery)
  }

  return (
    <div className="relative">
      <input
        type="text"
        placeholder="Search free stuff..."
        value={query}
        onChange={handleChange}
        className="w-full pl-10 pr-4 py-2 rounded-lg border border-gray-300 
                   focus:ring-2 focus:ring-blue-500 focus:border-transparent"
      />
      <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
        🔍
      </span>
    </div>
  )
}

export default SearchBar 