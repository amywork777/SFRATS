import { useState } from 'react'
import { search } from 'nominatim-browser'

interface AddressSearchProps {
  onSelect: (lat: number, lng: number) => void
}

function AddressSearch({ onSelect }: AddressSearchProps) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<any[]>([])
  const [isSearching, setIsSearching] = useState(false)

  const handleSearch = async () => {
    if (!query.trim()) return
    setIsSearching(true)
    try {
      const searchResults = await search({
        q: query + ' San Francisco',
        addressdetails: true,
        countrycodes: 'us',
      })
      setResults(searchResults)
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setIsSearching(false)
    }
  }

  return (
    <div className="mb-4">
      <div className="flex gap-2">
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search address…"
          className="flex-1 bg-paper-light border-2 border-ink px-3 py-2 font-sans text-[14px] text-ink placeholder:text-ink-fade outline-none focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
        />
        <button
          onClick={handleSearch}
          disabled={isSearching}
          className="px-4 py-2 bg-ink text-paper-light border-2 border-ink shadow-stamp font-mono text-[11px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] disabled:opacity-40 disabled:cursor-not-allowed transition-all"
        >
          {isSearching ? 'Searching…' : 'Search'}
        </button>
      </div>

      {results.length > 0 && (
        <ul className="mt-2 border-2 border-ink bg-paper-light divide-y divide-ink/15 shadow-stamp">
          {results.map((result: any) => (
            <li
              key={result.place_id}
              className="px-3 py-2 hover:bg-paper cursor-pointer text-[13px] text-ink"
              onClick={() => onSelect(Number(result.lat), Number(result.lon))}
            >
              {result.display_name}
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

export default AddressSearch
