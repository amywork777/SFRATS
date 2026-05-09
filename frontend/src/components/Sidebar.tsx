import { useState } from 'react'
import { Search } from 'lucide-react'
import { CATEGORY_ORDER, CategoryIcon } from '../utils/categoryIcons'
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
    : 'w-[300px] lg:w-[320px] h-[calc(100vh-4rem)] bg-paper-light fixed left-0 top-16 hidden md:flex md:flex-col z-[900] border-r border-ink/15'

  return (
    <aside className={`${containerClass} overflow-y-auto`}>
      <div className={isMobile ? 'p-3' : 'px-6 lg:px-7 py-6'}>
        {/* Section: Search */}
        <div className="mb-7">
          <div className="flex items-baseline justify-between mb-2">
            <span className="label">§ 01 · Search</span>
            <span className="font-mono text-[10px] text-ink-fade tracking-widest">find</span>
          </div>
          <div className="relative">
            <input
              type="text"
              placeholder="Couches, pizza, plants…"
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

        {/* Section: Categories */}
        <div className="mb-7">
          <div className="flex items-baseline justify-between mb-3">
            <span className="label">§ 02 · Filed Under</span>
            {filters.categories.length > 0 && (
              <button
                onClick={() => update({ ...filters, categories: [] })}
                className="text-xs text-bridge-600 hover:text-bridge-700 font-medium font-mono uppercase tracking-widest"
              >
                Clear
              </button>
            )}
          </div>
          <div className="flex flex-wrap gap-2">
            {CATEGORY_ORDER.map((category, i) => {
              const active = filters.categories.includes(category)
              const tilt = ['rotate-[-1.5deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]', 'rotate-[1.5deg]'][i % 4]
              return (
                <button
                  key={category}
                  onClick={() => handleCategoryToggle(category)}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 border border-ink font-mono text-[11px] uppercase tracking-[0.12em] font-semibold transition ${tilt}
                    ${active
                      ? 'bg-bridge-500 text-paper-light shadow-stamp'
                      : 'bg-paper-light text-ink hover:bg-paper'
                    }`}
                >
                  <CategoryIcon category={category} size={14} />
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

        {/* Footer note */}
        <div className="mt-10 pt-5 border-t border-ink/15">
          <p className="font-mono text-[10px] leading-relaxed text-ink-fade uppercase tracking-[0.1em]">
            All listings posted by neighbors. Free means free. Take what you need, leave the rest.
          </p>
        </div>
      </div>
    </aside>
  )
}

export default Sidebar
