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
    categories: [],
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
    : 'w-[320px] h-[calc(100vh-4rem)] bg-paper-light fixed left-0 top-16 hidden md:flex md:flex-col z-[900] border-r-2 border-ink'

  return (
    <aside className={`${containerClass} overflow-y-auto`}>
      <div className={isMobile ? 'p-3' : 'px-7 py-6'}>
        {/* Section: Search */}
        <div className="mb-7">
          <div className="flex items-baseline justify-between mb-2">
            <span className="label">§ 01 · Search</span>
            <span className="font-mono text-[10px] text-ink-fade tracking-widest">find</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="couches, pizza, plants…"
              className="w-full pl-9 pr-3 py-2.5 bg-paper border-2 border-ink font-mono text-[13px] placeholder:text-ink-fade outline-none focus:bg-paper-light focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
              value={filters.search}
              onChange={(e) => update({ ...filters, search: e.target.value })}
            />
            <svg
              className="absolute left-2.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-mute"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
          </div>
        </div>

        {/* Section: Categories */}
        <div className="mb-7">
          <div className="flex items-baseline justify-between mb-3">
            <span className="label">§ 02 · Filed Under</span>
            {filters.categories.length > 0 && (
              <button
                onClick={() => update({ ...filters, categories: [] })}
                className="font-mono text-[10px] uppercase tracking-widest text-bridge-600 hover:text-bridge-700 underline underline-offset-4 decoration-1"
              >
                clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {Object.entries(categoryEmojis).map(([category, emoji], i) => {
              const active = filters.categories.includes(category)
              // Slight per-chip rotation for the "stamped by hand" feel
              const tilt = ['rotate-[-1.5deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]', 'rotate-[1.5deg]'][i % 4]
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`group inline-flex items-center gap-1.5 px-3 py-1.5 border-2 font-mono text-[11px] uppercase tracking-[0.12em] font-semibold transition-all ${tilt}
                    ${active
                      ? 'bg-bridge-500 border-ink text-paper-light shadow-stamp'
                      : 'bg-paper-light border-ink text-ink hover:bg-paper hover:translate-x-[1px] hover:translate-y-[1px]'
                    }`}
                >
                  <span className="text-[14px] leading-none">{emoji}</span>
                  {category}
                </button>
              )
            })}
          </div>
        </div>

        {/* Section: Date */}
        <div>
          <div className="flex items-baseline justify-between mb-3">
            <span className="label">§ 03 · When</span>
          </div>
          <DateFilter onChange={(dates) => update({ ...filters, dates })} />
        </div>

        {/* Footer note — adds the editorial flavor */}
        <div className="mt-10 pt-5 rule-thick">
          <p className="font-mono text-[10px] leading-relaxed text-ink-fade uppercase tracking-[0.1em]">
            All listings posted by neighbors. Free means free. Take what you need, leave the rest.
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
