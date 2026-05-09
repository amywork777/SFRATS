import { useState } from 'react'

interface DateFilterProps {
  onChange: (dates: { start: Date | null; end: Date | null }) => void
}

function DateFilter({ onChange }: DateFilterProps) {
  const [selectedRange, setSelectedRange] = useState<string>('all')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')

  const handleQuickFilter = (range: string) => {
    setSelectedRange(range)

    const now = new Date()
    let start: Date | null = null
    let end: Date | null = null

    switch (range) {
      case 'today':
        start = new Date(now.setHours(0, 0, 0, 0))
        end = new Date(now.setHours(23, 59, 59, 999))
        break
      case 'week': {
        start = new Date()
        const weekEnd = new Date()
        weekEnd.setDate(weekEnd.getDate() + 7)
        end = weekEnd
        break
      }
      case 'month': {
        start = new Date()
        const monthEnd = new Date()
        monthEnd.setDate(monthEnd.getDate() + 30)
        end = monthEnd
        break
      }
      default:
        break
    }

    setStartDate(start ? start.toISOString().split('T')[0] : '')
    setEndDate(end ? end.toISOString().split('T')[0] : '')
    onChange({ start, end })
  }

  const options = [
    { id: 'all',   label: 'Any time' },
    { id: 'today', label: 'Today' },
    { id: 'week',  label: 'Week' },
    { id: 'month', label: 'Month' },
  ]

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-1.5">
        {options.map(option => {
          const active = selectedRange === option.id
          return (
            <button
              key={option.id}
              onClick={() => handleQuickFilter(option.id)}
              className={`px-3 py-1 rounded-full text-xs font-medium transition
                ${active
                  ? 'bg-stone-900 text-white'
                  : 'bg-stone-100 text-stone-700 hover:bg-stone-200'
                }`}
            >
              {option.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <input
          type="date"
          value={startDate}
          aria-label="From"
          className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm
                     focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20 outline-none transition"
          onChange={(e) => {
            setStartDate(e.target.value)
            setSelectedRange('custom')
            onChange({
              start: e.target.value ? new Date(e.target.value) : null,
              end: endDate ? new Date(endDate) : null,
            })
          }}
        />
        <input
          type="date"
          value={endDate}
          aria-label="To"
          className="w-full rounded-lg border border-stone-200 bg-white px-2.5 py-1.5 text-sm
                     focus:border-rust-500 focus:ring-2 focus:ring-rust-500/20 outline-none transition"
          onChange={(e) => {
            setEndDate(e.target.value)
            setSelectedRange('custom')
            onChange({
              start: startDate ? new Date(startDate) : null,
              end: e.target.value ? new Date(e.target.value) : null,
            })
          }}
        />
      </div>
    </div>
  )
}

export default DateFilter
