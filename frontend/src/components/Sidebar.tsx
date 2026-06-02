import { useState } from 'react'
import { Search } from 'lucide-react'
import DatePicker from './DatePicker'
import NearMe from './NearMe'
import { readUrlFilters } from '../utils/urlFilters'

export interface SidebarFilters {
  search: string
  dates: { start: Date | null; end: Date | null }
  userLocation: { lat: number; lng: number } | null
  radiusMiles: number
}

interface SidebarProps {
  onFiltersChange: (filters: SidebarFilters) => void
  isMobile?: boolean
}

function Sidebar({ onFiltersChange, isMobile = false }: SidebarProps) {
  const [filters, setFilters] = useState<SidebarFilters>(() => {
    const u = typeof window !== 'undefined' ? readUrlFilters(window.location.search) : { search: '' }
    return {
      search: u.search,
      dates: { start: null, end: null },
      userLocation: null,
      radiusMiles: 2,
    }
  })

  const update = (next: typeof filters) => {
    setFilters(next)
    onFiltersChange(next)
  }

  const containerClass = isMobile
    ? 'w-full text-sm'
    : 'w-[300px] lg:w-[320px] h-[calc(100vh-4rem)] bg-paper-light fixed left-0 top-16 hidden md:flex md:flex-col z-[900] border-r border-ink/15'

  return (
    <aside className={`${containerClass} overflow-y-auto`}>
      <div className={isMobile ? 'p-3' : 'px-6 lg:px-7 py-6'}>
        {/* Section: Search */}
        <div className="mb-7">
          <div className="flex items-baseline justify-between mb-2">
            <span className="label">Search</span>
            <span className="font-mono text-[10px] text-ink-fade tracking-widest">find</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Concerts, markets, comedy…"
              className="w-full pl-9 pr-3 py-2.5 bg-paper border border-ink/30 font-mono text-[13px] placeholder:text-ink-fade outline-none focus:bg-paper-light focus:border-ink focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
              value={filters.search}
              onChange={(e) => update({ ...filters, search: e.target.value })}
            />
            <Search
              size={15}
              strokeWidth={2.2}
              className="absolute left-2.5 top-1/2 -translate-y-1/2 text-ink-mute"
            />
          </div>
        </div>

        {/* Section: Date */}
        <div className="mb-7">
          <div className="flex items-baseline justify-between mb-3">
            <span className="label">When</span>
          </div>
          <DatePicker
            value={filters.dates}
            onChange={(dates) => update({ ...filters, dates })}
          />
        </div>

        {/* Section: Near me */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="label">Near me</span>
          </div>
          <NearMe
            location={filters.userLocation}
            radiusMiles={filters.radiusMiles}
            onChange={({ location, radiusMiles }) =>
              update({ ...filters, userLocation: location, radiusMiles })
            }
          />
        </div>

        {/* Footer note */}
        <div className="mt-10 pt-5 border-t border-ink/15">
          <p className="font-mono text-[10px] leading-relaxed text-ink-fade uppercase tracking-[0.1em]">
            All events posted by neighbors. Free means free. Show up, enjoy, share the word.
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
