import { useState } from 'react'
import { XMarkIcon, FunnelIcon } from '@heroicons/react/24/outline'

interface MobileNavProps {
  onFiltersChange: (filters: any) => void
}

export default function MobileNav({ onFiltersChange }: MobileNavProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [selectedCategories, setSelectedCategories] = useState<string[]>([])
  const [timeRange, setTimeRange] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const categories = ['Items', 'Food', 'Events', 'Services'] as const
  const categoryEmojis: Record<string, string> = {
    Items: '📦', Food: '🍕', Events: '🎉', Services: '🔧',
  }
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
      start = new Date(now.setHours(0,0,0,0))
      end   = new Date(now.setHours(23,59,59,999))
    } else if (range === 'week')  { start = new Date(); end = new Date(); end.setDate(end.getDate() + 7) }
    else if (range === 'month') { start = new Date(); end = new Date(); end.setDate(end.getDate() + 30) }
    setStartDate(start ? start.toISOString().split('T')[0] : '')
    setEndDate(end ? end.toISOString().split('T')[0] : '')
    onFiltersChange({ dates: { start, end } })
  }

  return (
    <>
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-20 right-4 z-[2000] md:hidden bg-bridge-500 text-paper-light p-3 border-2 border-ink shadow-stamp"
        aria-label="Filters"
      >
        <FunnelIcon className="h-5 w-5" />
      </button>

      <div className={`
        fixed inset-0 z-[2000] md:hidden transform transition-transform duration-300
        ${isOpen ? 'translate-y-0' : 'translate-y-full'}
      `}>
        <div className="absolute inset-0 bg-ink/40" onClick={() => setIsOpen(false)} />

        <div className="absolute inset-x-0 bottom-0 bg-paper-light border-t-2 border-ink max-h-[85vh] overflow-y-auto">
          <div className="sticky top-0 bg-paper-light border-b-2 border-ink px-4 py-3 flex justify-between items-center">
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
                className="p-1 hover:bg-paper transition-colors"
                aria-label="Close"
              >
                <XMarkIcon className="h-4 w-4 text-ink-mute" />
              </button>
            </div>
          </div>

          <div className="p-5 space-y-7 pb-24">
            {/* Search */}
            <div>
              <span className="label">§ 01 · Search</span>
              <input
                type="text"
                placeholder="couches, pizza, plants…"
                onChange={(e) => onFiltersChange({ search: e.target.value })}
                className="mt-2 w-full px-3 py-2 bg-paper border-2 border-ink font-mono text-[13px] placeholder:text-ink-fade outline-none focus:bg-paper-light focus:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-shadow"
              />
            </div>

            {/* Categories */}
            <div>
              <span className="label">§ 02 · Filed Under</span>
              <div className="mt-3 grid grid-cols-2 gap-2">
                {categories.map((category, i) => {
                  const active = selectedCategories.includes(category)
                  const tilt = ['rotate-[-1.5deg]', 'rotate-[1deg]', 'rotate-[-0.5deg]', 'rotate-[1.5deg]'][i % 4]
                  return (
                    <button
                      key={category}
                      onClick={() => toggleCategory(category)}
                      className={`flex items-center justify-between px-3 py-2 border-2 border-ink font-mono text-[11px] uppercase tracking-[0.12em] font-semibold transition-all ${tilt}
                        ${active
                          ? 'bg-bridge-500 text-paper-light shadow-stamp'
                          : 'bg-paper-light text-ink hover:bg-paper'
                        }`}
                    >
                      <span className="flex items-center gap-2">
                        <span className="text-[13px]">{categoryEmojis[category]}</span>
                        {category}
                      </span>
                      {active && <span>✓</span>}
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
                      className={`px-3 py-2 border-2 border-ink font-mono text-[11px] uppercase tracking-[0.1em] font-semibold transition
                        ${active ? 'bg-ink text-paper-light' : 'bg-paper-light text-ink hover:bg-paper'}`}
                    >
                      {range.label}
                    </button>
                  )
                })}
              </div>

              <div className="mt-4 pt-4 rule-hair">
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
                      className="w-full bg-paper-light border-2 border-ink px-2 py-1 font-mono text-[12px] text-ink outline-none"
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
                      className="w-full bg-paper-light border-2 border-ink px-2 py-1 font-mono text-[12px] text-ink outline-none"
                    />
                  </label>
                </div>
              </div>
            </div>

            {/* Done */}
            <div className="rule-thick pt-5">
              <button
                onClick={() => setIsOpen(false)}
                className="w-full py-3 bg-bridge-500 text-paper-light border-2 border-ink shadow-stamp font-mono text-[12px] uppercase tracking-[0.14em] font-semibold hover:translate-x-[1px] hover:translate-y-[1px] hover:shadow-[2px_2px_0_0_rgba(24,22,19,1)] transition-all"
              >
                Apply
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}
