import { useState } from 'react'
import { X, SlidersHorizontal, Check } from 'lucide-react'
import { CATEGORY_ORDER, CategoryIcon } from '../utils/categoryIcons'

interface MobileNavProps {
  onFiltersChange: (filters: any) => void
}

export default function MobileNav({ onFiltersChange }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const timeRanges = [
    { id: 'all',   label: 'Any time' },
    { id: 'today', label: 'Today' },
    { id: 'week',  label: '7 days' },
    { id: 'month', label: '30 days' },
  ]

  const toggleCategory = (category: string) => {
    const next = selectedCategories.includes(category)
      ? selectedCategories.filter(c => c !== category)
      : [...selectedCategories, category]
    setSelectedCategories(next)
    onFiltersChange({ categories: next })
  }

  const handleTimeRangeChange = (range: string) => {
    setTimeRange(range)
    let start: Date | null = null
    let end: Date | null = null
    const now = new Date()
    if (range === 'today') {
      start = new Date(now.setHours(0, 0, 0, 0))
      end   = new Date(now.setHours(23, 59, 59, 999))
    } else if (range === 'week')  { start = new Date(); end = new Date(); end.setDate(end.getDate() + 7) }
    else if (range === 'month') { start = new Date(); end = new Date(); end.setDate(end.getDate() + 30) }
    setStartDate(start ? start.toISOString().split('T')[0] : '')
    setEndDate(end ? end.toISOString().split('T')[0] : '')
    onFiltersChange({ dates: { start, end } })
  }

  const filterCount = selectedCategories.length + (timeRange !== 'all' ? 1 : 0)

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-5 right-5 z-[2000] md:hidden bg-bridge-500 text-paper-light w-14 h-14 border border-ink shadow-stamp flex items-center justify-center"
        aria-label="Filters"
      >
        <SlidersHorizontal size={20} strokeWidth={2.2} />
        {filterCount > 0 && (
          <span className="absolute -top-1.5 -right-1.5 bg-ink text-paper-light w-5 h-5 text-[10px] font-mono font-bold flex items-center justify-center border border-paper-light">
            {filterCount}
          </span>
        )}
      </button>

      <div className={`
        fixed inset-0 z-[2000] md:hidden transform transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full pointer-events-none'}
      `}>
        <div className="absolute inset-0 bg-ink/40" onClick={() => setIsOpen(false)} />

        <div className="absolute inset-x-0 bottom-0 bg-paper-light border-t border-ink max-h-[88vh] overflow-y-auto">
          <div className="sticky top-0 bg-paper-light border-b border-ink px-4 py-3 flex justify-between items-center">
            <h2 className="font-display font-bold text-[20px] text-ink">Filter</h2>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  setSelectedCategories([])
                  setTimeRange('all')
                  setStartDate(''); setEndDate('')
                  onFiltersChange({ search: '', categories: [], dates: { start: null, end: null } })
                }}
                className="font-mono text-[10px] uppercase tracking-[0.14em] text-bridge-600 hover:text-bridge-700 px-2 py-1"
              >
                Clear
              </button>
              <button
                onClick={() => setIsOpen(false)}
                className="p-1.5 hover:bg-paper transition-colors"
                aria-label="Close"
              >
                <X size={18} strokeWidth={2.2} className="text-ink-mute" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-7 pb-28">
            {/* Search */}
            <div>
              <span className="label">§ 01 · Search</span>
              <input
                type="text"
                placeholder="couches, pizza, plants…"
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="mt-2 w-full px-3 py-2.5 bg-paper border border-ink/30 font-mono text-[14px] placeholder:text-ink-fade outline-none focus:bg-paper-light focus:border-ink focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
              />
            </div>

            {/* Categories */}
            <div>
              <span className="label">§ 02 · Filed Under</span>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {CATEGORY_ORDER.map((category, i) => {
                  const active = selectedCategories.includes(category)
                  const tilt = ['rotate-[-1deg]', 'rotate-[0.5deg]', 'rotate-[-0.5deg]', 'rotate-[1deg]'][i % 4]
                  return (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`flex items-center justify-between px-3 py-2.5 border border-ink font-mono text-[12px] uppercase tracking-[0.12em] font-semibold transition-all ${tilt}
                        ${active
                          ? 'bg-bridge-500 text-paper-light shadow-stamp'
                          : 'bg-paper-light text-ink hover:bg-paper'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <CategoryIcon category={category} size={16} />
                        {category}
                      </span>
                      {active && <Check size={14} strokeWidth={2.5} />}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Time */}
            <div>
              <span className="label">§ 03 · When</span>
              <div className="mt-3 grid grid-cols-2 gap-1.5">
                {timeRanges.map(range => {
                  const active = timeRange === range.id
                  return (
                    <button
                      key={range.id}
                      onClick={() => handleTimeRangeChange(range.id)}
                      className={`px-3 py-2.5 border border-ink font-mono text-[12px] uppercase tracking-[0.1em] font-semibold transition
                        ${active ? 'bg-ink text-paper-light' : 'bg-paper-light text-ink hover:bg-paper'}`}
                    >
                      {range.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 pt-4 border-t border-ink/15">
                <div className="grid grid-cols-2 gap-2">
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute block mb-1">From</span>
                    <input
                      type="date"
                      value={startDate}
                      onChange={(e) => {
                        setStartDate(e.target.value); setTimeRange('custom')
                        onFiltersChange({ dates: { start: e.target.value ? new Date(e.target.value) : null, end: endDate ? new Date(endDate) : null } })
                      }}
                      className="w-full bg-paper-light border border-ink/30 px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-ink"
                    />
                  </label>
                  <label className="block">
                    <span className="font-mono text-[10px] uppercase tracking-[0.14em] text-ink-mute block mb-1">To</span>
                    <input
                      type="date"
                      value={endDate}
                      onChange={(e) => {
                        setEndDate(e.target.value); setTimeRange('custom')
                        onFiltersChange({ dates: { start: startDate ? new Date(startDate) : null, end: e.target.value ? new Date(e.target.value) : null } })
                      }}
                      className="w-full bg-paper-light border border-ink/30 px-2 py-1.5 font-mono text-[12px] text-ink outline-none focus:border-ink"
                    />
                  </label>
                </div>
              </div>
            </div>
          </div>

          {/* Sticky Apply */}
          <div className="sticky bottom-0 bg-paper-light border-t border-ink p-4">
            <button
              onClick={() => setIsOpen(false)}
              className="w-full py-3 bg-bridge-500 text-paper-light border border-ink shadow-stamp font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
            >
              Show {filterCount > 0 ? `(${filterCount} filter${filterCount === 1 ? '' : 's'})` : 'all listings'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
