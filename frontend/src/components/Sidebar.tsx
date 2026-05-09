import { useState } from 'react'
import { categoryEmojis } from '../utils/categoryConstants'
import DateFilter from './Sidebar/DateFilter'

interface SidebarProps {
  onFiltersChange: (filters: {
    search: string;
    dates: { start: Date | null; end: Date | null };
    categories: string[];
  }) => void;
  isMobile?: boolean;
}

function Sidebar({ onFiltersChange, isMobile = false }: SidebarProps) {
  const [filters, setFilters] = useState<{
    search: string;
    dates: { start: Date | null; end: Date | null };
    categories: string[];
  }>({
    search: '',
    dates: { start: null, end: null },
    categories: []
  })

  const update = (next: typeof filters) => {
    setFilters(next)
    onFiltersChange(next)
  }

  const handleCategoryToggle = (category: string) => {
    const newCategories = filters.categories.includes(category)
      ? filters.categories.filter(c => c !== category)
      : [...filters.categories, category]
    update({ ...filters, categories: newCategories })
  }

  const containerClass = isMobile
    ? 'w-full text-sm'
    : 'w-80 h-[calc(100vh-4rem)] bg-white border-r border-stone-200 fixed left-0 top-16 hidden md:flex md:flex-col z-[900]'

  return (
    <aside className={`${containerClass} overflow-y-auto`}>
      <div className={isMobile ? 'p-3' : 'p-6'}>
        {/* Search */}
        <div className="mb-6">
          <label className="text-[11px] uppercase tracking-[0.14em] text-stone-500 font-semibold">
            Search
          </label>
          <div className="relative mt-1.5">
            <input
              type="text"
              placeholder="Couches, pizza, plants…"
              className="w-full pl-9 pr-3 py-2 bg-stone-100 border border-transparent focus:bg-white focus:border-stone-300 rounded-lg text-sm placeholder-stone-400 outline-none transition"
              value={filters.search}
              onChange={(e) => update({ ...filters, search: e.target.value })}
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-stone-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Categories — chip style */}
        <div className="mb-6">
          <div className="flex items-baseline justify-between mb-2.5">
            <label className="text-[11px] uppercase tracking-[0.14em] text-stone-500 font-semibold">
              Categories
            </label>
            {filters.categories.length > 0 && (
              <button
                onClick={() => update({ ...filters, categories: [] })}
                className="text-xs text-rust-600 hover:text-rust-700 font-medium"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryEmojis).map(([category, emoji]) => {
              const active = filters.categories.includes(category)
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-sm font-medium transition
                    ${active
                      ? 'bg-rust-500 border-rust-500 text-white shadow-soft'
                      : 'bg-white border-stone-200 text-stone-700 hover:border-stone-300'
                    }`}
                >
                  <span className="text-base leading-none">{emoji}</span>
                  {category}
                </button>
              )
            })}
          </div>
        </div>

        {/* Date filter */}
        <div className="pt-4 border-t border-stone-200">
          <label className="text-[11px] uppercase tracking-[0.14em] text-stone-500 font-semibold">
            Date
          </label>
          <div className="mt-1.5">
            <DateFilter
              onChange={(dates) => update({ ...filters, dates })}
            />
          </div>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
